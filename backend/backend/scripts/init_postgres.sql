-- Создание базы данных
CREATE DATABASE IF NOT EXISTS datalake;

\c datalake;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица кошельков
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reference_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Таблица агрегированных метрик качества
CREATE TABLE IF NOT EXISTS quality_metrics_aggregated (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER,
    f1_score FLOAT,
    precision FLOAT,
    recall FLOAT,
    tasks_completed INTEGER,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_quality_metrics_user_id ON quality_metrics_aggregated(user_id);
CREATE INDEX idx_quality_metrics_period ON quality_metrics_aggregated(period_start, period_end);

-- Создание тестового пользователя (пароль: admin123)
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjFZQZ1HjYxG', 'admin', 'System Admin')
ON CONFLICT (email) DO NOTHING;

-- Создание кошелька для админа
INSERT INTO wallets (user_id, balance)
SELECT id, 1000 FROM users WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;
