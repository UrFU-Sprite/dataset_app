// Инициализация MongoDB
db = db.getSiblingDB('datalake');

// Создание коллекций
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('users_profile');
db.createCollection('sessions');

// Создание индексов
db.projects.createIndex({ "name": 1 });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "created_by": 1 });
db.projects.createIndex({ "created_at": -1 });

db.tasks.createIndex({ "project_id": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "assigned_to": 1 });
db.tasks.createIndex({ "created_at": -1 });
db.tasks.createIndex({ "project_id": 1, "status": 1, "assigned_to": 1 });

db.users_profile.createIndex({ "user_id": 1 }, { unique: true });
db.users_profile.createIndex({ "rating": -1 });

db.sessions.createIndex({ "session_id": 1 }, { unique: true });
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

// Вставка тестовых данных
db.projects.insertOne({
    name: "Sample Project",
    type: "classification",
    config: {
        classes: ["cat", "dog", "bird"],
        multilabel: false
    },
    description: "Sample project for testing",
    tags: ["test", "sample"],
    status: "draft",
    created_by: 1,
    created_at: new Date(),
    updated_at: new Date()
});

print("MongoDB initialization completed");
