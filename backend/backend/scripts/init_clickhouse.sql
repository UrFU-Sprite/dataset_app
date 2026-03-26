-- Создание базы данных
CREATE DATABASE IF NOT EXISTS datalake;

USE datalake;

-- Таблица событий аннотации
CREATE TABLE IF NOT EXISTS annotation_events (
    event_id UUID,
    task_id String,
    user_id UInt32,
    project_id UInt32,
    action_type String,
    annotation_data String,
    latency_ms UInt32,
    event_time DateTime
) ENGINE = MergeTree()
ORDER BY (project_id, event_time)
PARTITION BY toYYYYMM(event_time);

-- Таблица логов задач
CREATE TABLE IF NOT EXISTS task_events_log (
    task_id String,
    project_id UInt32,
    event_type String,
    user_id UInt32,
    timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp);

-- Материализованное представление для дневной статистики аннотаторов
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_annotator_stats
ENGINE = SummingMergeTree()
ORDER BY (date, user_id)
AS SELECT
    toDate(event_time) as date,
    user_id,
    count() as total_actions,
    sum(latency_ms) as total_latency,
    countIf(action_type = 'submit') as tasks_completed,
    avg(latency_ms) as avg_latency
FROM annotation_events
GROUP BY date, user_id;

-- Материализованное представление для статистики проектов
CREATE MATERIALIZED VIEW IF NOT EXISTS project_stats
ENGINE = SummingMergeTree()
ORDER BY (date, project_id)
AS SELECT
    toDate(event_time) as date,
    project_id,
    countIf(action_type = 'submit') as tasks_submitted,
    countIf(action_type = 'start') as tasks_started,
    avg(latency_ms) as avg_completion_time
FROM annotation_events
GROUP BY date, project_id;
