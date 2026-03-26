from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from loguru import logger
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_fscore_support

from app.database.mongodb import mongodb_manager


def _extract_label(annotations: Any) -> str:
    """Best-effort label extraction from heterogeneous annotation payloads."""
    if isinstance(annotations, dict):
        for key in ("label", "class", "value", "target"):
            if key in annotations:
                return str(annotations[key])
        # Support {"labels": ["a","b"]} -> take first
        if "labels" in annotations and annotations["labels"]:
            return str(annotations["labels"][0])
    if annotations is None:
        return "none"
    return str(annotations)


def _extract_features(data: Dict[str, Any], dim: int = 5) -> np.ndarray:
    """Extract numeric features from task.data; if missing generate deterministic pseudo-features."""
    features = data.get("features") if isinstance(data, dict) else None
    vec: List[float] = []
    if isinstance(features, list) and all(isinstance(x, (int, float)) for x in features):
        vec = [float(x) for x in features]
    else:
        # Deterministic fallback: use hash of json payload.
        seed = abs(hash(json.dumps(data, sort_keys=True, ensure_ascii=False))) % (2**32)
        rng = np.random.default_rng(seed)
        vec = rng.normal(loc=0.0, scale=1.0, size=dim).tolist()

    if len(vec) < dim:
        vec = vec + [0.0] * (dim - len(vec))
    if len(vec) > dim:
        vec = vec[:dim]
    return np.asarray(vec, dtype=np.float32)


@dataclass
class Pred:
    label: str
    confidence: float
    uncertainty: float


class AnalyticsService:
    """Quality metrics, Active Learning, and simple ranking."""

    def __init__(self) -> None:
        self._model_cache: Dict[str, Tuple[Any, List[str]]] = {}

    def _get_or_train_model(self, model_type: str) -> Tuple[Any, List[str]]:
        if model_type in self._model_cache:
            return self._model_cache[model_type]

        # Optional integrations (TensorFlow / PyTorch are "pluggable", but may not be installed).
        if model_type.startswith("torch"):
            try:
                import torch  # noqa: F401
            except Exception as e:
                raise ImportError("Torch integration requested but 'torch' is not installed") from e
            # For this course demo we still use a lightweight sklearn fallback.
        if model_type.startswith("tensorflow"):
            try:
                import tensorflow as tf  # noqa: F401
            except Exception as e:
                raise ImportError("TensorFlow integration requested but 'tensorflow' is not installed") from e
            # For this course demo we still use a lightweight sklearn fallback.

        # "Pre-trained" demo model: train on synthetic data (fast).
        dim = 5
        classes = ["class_0", "class_1", "class_2"]

        rng = np.random.default_rng(42)
        X = rng.normal(size=(600, dim))
        y = rng.choice(classes, size=(600,))

        if model_type in ("logreg", "logistic_regression"):
            clf = LogisticRegression(max_iter=400, multi_class="auto")
        else:
            clf = LogisticRegression(max_iter=400, multi_class="auto")
        clf.fit(X, y)
        self._model_cache[model_type] = (clf, classes)
        return clf, classes

    async def quality_metrics(
        self,
        project_id: str,
        annotator_a: int,
        annotator_b: int,
    ) -> Dict[str, Any]:
        annotations_col = await mongodb_manager.get_collection("task_annotations")

        # Fetch all annotations for both annotators and intersect by task_id in Python.
        cursor = annotations_col.find(
            {"project_id": project_id, "user_id": {"$in": [annotator_a, annotator_b]}}
        )
        a_by_task: Dict[str, Any] = {}
        b_by_task: Dict[str, Any] = {}

        async for doc in cursor:
            tid = doc["task_id"]
            if doc["user_id"] == annotator_a:
                a_by_task[tid] = doc["annotations"]
            elif doc["user_id"] == annotator_b:
                b_by_task[tid] = doc["annotations"]

        common_task_ids = sorted(set(a_by_task.keys()) & set(b_by_task.keys()))
        if not common_task_ids:
            return {
                "project_id": project_id,
                "annotator_a": annotator_a,
                "annotator_b": annotator_b,
                "f1_score": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "tasks_completed": 0,
                "period": datetime.utcnow().strftime("%Y-%m-%d"),
            }

        y_true = [_extract_label(b_by_task[tid]) for tid in common_task_ids]
        y_pred = [_extract_label(a_by_task[tid]) for tid in common_task_ids]

        precision, recall, f1, _support = precision_recall_fscore_support(
            y_true, y_pred, average="macro", zero_division=0
        )

        return {
            "project_id": project_id,
            "annotator_a": annotator_a,
            "annotator_b": annotator_b,
            "f1_score": float(f1),
            "precision": float(precision),
            "recall": float(recall),
            "tasks_completed": len(common_task_ids),
            "period": datetime.utcnow().strftime("%Y-%m-%d"),
        }

    async def active_learning_next(
        self,
        project_id: str,
        num_tasks: int = 5,
        model_type: str = "logreg",
        annotator_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        tasks_col = await mongodb_manager.get_collection("tasks")
        tasks_cursor = tasks_col.find(
            {"project_id": project_id, "status": {"$in": ["pending", "in_progress"]}}
        ).limit(max(200, num_tasks * 20))

        # Build candidate features.
        candidates: List[Dict[str, Any]] = []
        async for doc in tasks_cursor:
            candidates.append(doc)

        if not candidates:
            return {"project_id": project_id, "items": [], "message": "No pending tasks"}

        clf, _classes = self._get_or_train_model(model_type)

        label_pref: Dict[str, float] = {}
        if annotator_id is not None:
            annotations_col_pref = await mongodb_manager.get_collection("task_annotations")
            cursor_pref = annotations_col_pref.find({"project_id": project_id, "user_id": annotator_id}, {"annotations": 1})
            async for doc in cursor_pref:
                lbl = _extract_label(doc.get("annotations"))
                label_pref[lbl] = label_pref.get(lbl, 0.0) + 1.0

        preds: List[Tuple[str, Pred, float]] = []
        for doc in candidates:
            tid = str(doc["_id"])
            x = _extract_features(doc.get("data") or {}, dim=5).reshape(1, -1)
            proba = clf.predict_proba(x)[0]
            idx = int(np.argmax(proba))
            confidence = float(proba[idx])
            uncertainty = float(1.0 - confidence)
            label = str(clf.classes_[idx])
            # Personalization: prefer labels the annotator has historically submitted.
            pref = float(label_pref.get(label, 0.0))
            adjusted_uncertainty = uncertainty + pref * 0.02
            preds.append((tid, Pred(label=label, confidence=confidence, uncertainty=uncertainty), adjusted_uncertainty))

        preds.sort(key=lambda t: t[2], reverse=True)
        top = preds[:num_tasks]

        items = [
            {
                "task_id": tid,
                "suggested_annotation": {"label": pred.label},
                "confidence": pred.confidence,
                "uncertainty": pred.uncertainty,
            }
            for tid, pred, _adjusted in top
        ]
        return {"project_id": project_id, "items": items, "model_type": model_type}

    async def predict_labels(
        self,
        items: List[Dict[str, Any]],
        model_type: str = "logreg",
    ) -> Dict[str, Any]:
        """Predict suggested labels for provided items (feature extraction is best-effort)."""
        clf, _classes = self._get_or_train_model(model_type)

        out: List[Dict[str, Any]] = []
        for item in items:
            task_id = item.get("task_id")
            data = item.get("data") or {}
            x = _extract_features(data, dim=5).reshape(1, -1)
            proba = clf.predict_proba(x)[0]
            idx = int(np.argmax(proba))
            confidence = float(proba[idx])
            label = str(clf.classes_[idx])
            out.append(
                {
                    "task_id": task_id,
                    "suggested_annotation": {"label": label},
                    "confidence": confidence,
                    "uncertainty": float(1.0 - confidence),
                }
            )
        return {"model_type": model_type, "items": out}

    async def rank_annotators(
        self,
        project_id: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        profiles_col = await mongodb_manager.get_collection("users_profile")
        annotations_col = await mongodb_manager.get_collection("task_annotations")

        # Completion counts for this project.
        cursor = annotations_col.find({"project_id": project_id}, {"user_id": 1})
        completion: Dict[int, int] = {}
        async for doc in cursor:
            uid = int(doc["user_id"])
            completion[uid] = completion.get(uid, 0) + 1

        # Fetch profiles for those users (global rating).
        users: List[Dict[str, Any]] = []
        for uid in completion.keys():
            prof = await profiles_col.find_one({"user_id": uid})
            if not prof:
                rating = 0.0
                tasks_completed = 0
            else:
                rating = float(prof.get("rating", 0.0))
                tasks_completed = int(prof.get("tasks_completed", completion.get(uid, 0)))

            score = rating + completion.get(uid, 0) * 0.1 + tasks_completed * 0.01
            users.append({"user_id": uid, "rating": rating, "tasks_completed": tasks_completed, "project_tasks_completed": completion.get(uid, 0), "score": float(score)})

        users.sort(key=lambda u: u["score"], reverse=True)
        return {"project_id": project_id, "limit": limit, "items": users[:limit]}

    async def integrity_check(self, project_id: str) -> Dict[str, Any]:
        tasks_col = await mongodb_manager.get_collection("tasks")
        cursor = tasks_col.find({"project_id": project_id}, {"data": 1, "status": 1})
        total = 0
        missing_features = 0
        invalid_status = 0
        async for doc in cursor:
            total += 1
            data = doc.get("data") or {}
            if "features" not in data:
                missing_features += 1
            if doc.get("status") not in {"pending", "in_progress", "completed", "verified", "skipped"}:
                invalid_status += 1

        return {
            "project_id": project_id,
            "total_tasks": total,
            "missing_features": missing_features,
            "invalid_status": invalid_status,
            "ok": invalid_status == 0,
        }

    async def project_progress(self, project_id: str) -> Dict[str, Any]:
        tasks_col = await mongodb_manager.get_collection("tasks")
        cursor = tasks_col.find({"project_id": project_id}, {"status": 1})
        counts: Dict[str, int] = {}
        total = 0
        async for doc in cursor:
            total += 1
            st = doc.get("status") or "unknown"
            counts[st] = counts.get(st, 0) + 1
        return {"project_id": project_id, "total_tasks": total, "by_status": counts}

    async def list_notifications(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        notifications_col = await mongodb_manager.get_collection("notifications")
        cursor = notifications_col.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        items: List[Dict[str, Any]] = []
        async for doc in cursor:
            items.append(
                {
                    "id": str(doc.get("_id")),
                    "user_id": doc.get("user_id"),
                    "message": doc.get("message"),
                    "created_at": doc.get("created_at"),
                    "kind": doc.get("kind", "info"),
                }
            )
        return {"user_id": user_id, "limit": limit, "items": items}

