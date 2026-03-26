from clickhouse_driver import Client
from typing import Optional, List, Dict, Any
from loguru import logger

class ClickHouseManager:
    def __init__(self):
        self.client: Optional[Client] = None
    
    async def connect(self, host: str, port: int, user: str, password: str):
        """Установка соединения с ClickHouse"""
        try:
            self.client = Client(
                host=host,
                port=port,
                user=user,
                password=password,
                # Some clickhouse-driver versions don't accept `compress` kwarg.
            )
            
            # Проверка соединения
            result = self.client.execute("SELECT 1")
            logger.info(f"Connected to ClickHouse at {host}:{port}")
            
            # Создание таблиц
            await self._create_tables()
            
        except Exception as e:
            logger.error(f"Failed to connect to ClickHouse: {e}")
            raise
    
    async def disconnect(self):
        """Закрытие соединения"""
        if self.client:
            self.client.disconnect()
            logger.info("Disconnected from ClickHouse")
    
    async def _create_tables(self):
        """Создание таблиц ClickHouse"""
        
        # Таблица событий аннотации
        self.client.execute("""
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
            PARTITION BY toYYYYMM(event_time)
        """)
        
        # Таблица логов задач
        self.client.execute("""
            CREATE TABLE IF NOT EXISTS task_events_log (
                task_id String,
                project_id UInt32,
                event_type String,
                user_id UInt32,
                timestamp DateTime
            ) ENGINE = MergeTree()
            ORDER BY (project_id, timestamp)
        """)
        
        # Материализованное представление для статистики
        self.client.execute("""
            CREATE MATERIALIZED VIEW IF NOT EXISTS daily_annotator_stats
            ENGINE = SummingMergeTree()
            ORDER BY (date, user_id)
            AS SELECT
                toDate(event_time) as date,
                user_id,
                count() as total_actions,
                sum(latency_ms) as total_latency,
                countIf(action_type = 'submit') as tasks_completed
            FROM annotation_events
            GROUP BY date, user_id
        """)
        
        logger.info("ClickHouse tables created")
    
    async def execute(self, query: str, params: Optional[Dict] = None) -> List[tuple]:
        """Выполнение запроса"""
        if not self.client:
            raise RuntimeError("ClickHouse not connected")
        
        try:
            if params:
                return self.client.execute(query, params)
            return self.client.execute(query)
        except Exception as e:
            logger.error(f"ClickHouse query failed: {query}, error: {e}")
            raise
    
    async def insert(self, table: str, data: List[Dict[str, Any]]):
        """Вставка данных"""
        if not data:
            return
        
        columns = list(data[0].keys())
        values = [[row.get(col) for col in columns] for row in data]
        
        query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES"
        
        try:
            self.client.execute(query, values, types_check=True)
        except Exception as e:
            logger.error(f"Failed to insert into {table}: {e}")
            raise

# Глобальный экземпляр
clickhouse_manager = ClickHouseManager()
