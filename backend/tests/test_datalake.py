import requests
import json

BASE_URL = "http://localhost:8000"

def test_all_services():
    print("="*60)
    print("ПРОВЕРКА ЗАДАНИЯ 1: ЦЕНТРАЛИЗОВАННОЕ ХРАНИЛИЩЕ ДАННЫХ")
    print("="*60)
    
    # 1. Проверка Health Check
    print("\n1. HEALTH CHECK")
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Health Check: {data['status']}")
        for service, status in data['services'].items():
            status_icon = "✅" if status == "healthy" else "⚠️"
            print(f"   {status_icon} {service}: {status}")
    
    # 2. Проверка регистрации (PostgreSQL)
    print("\n2. PostgreSQL (структурные данные)")
    register_data = {
        "email": "test_datalake@example.com",
        "password": "test123",
        "role": "annotator",
        "full_name": "DataLake Tester"
    }
    response = requests.post(f"{BASE_URL}/api/v1/users/register", json=register_data)
    if response.status_code == 201:
        user = response.json()
        print(f"   ✅ Пользователь создан: ID={user['id']}, Email={user['email']}")
    else:
        print(f"   ❌ Ошибка: {response.status_code}")
    
    # 3. Проверка создания проекта (MongoDB)
    print("\n3. MongoDB (полуструктурированные данные)")
    project_data = {
        "name": "Test DataLake Project",
        "type": "classification",
        "config": {
            "classes": ["cat", "dog", "bird"],
            "multilabel": False,
            "custom_settings": {"threshold": 0.8}
        },
        "description": "Testing Data Lake functionality",
        "tags": ["test", "datalake"]
    }
    response = requests.post(f"{BASE_URL}/api/v1/projects/", json=project_data)
    if response.status_code == 401:
        print("   ⚠️ Нужна аутентификация для создания проекта")
        print("   🔑 Сначала войдите в систему")
    
    # 4. Проверка входа (PostgreSQL)
    print("\n4. Аутентификация")
    login_response = requests.post(f"{BASE_URL}/api/v1/users/login", params={"email": "test_datalake@example.com", "password": "test123"})
    if login_response.status_code == 200:
        token_data = login_response.json()
        token = token_data.get("access_token")
        print(f"   ✅ Токен получен")
        
        # 5. Создание проекта с токеном
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/v1/projects/", json=project_data, headers=headers)
        if response.status_code == 201:
            project = response.json()
            print(f"   ✅ Проект создан: ID={project['id']}, Name={project['name']}")
            project_id = project['id']
            
            # 6. Создание задачи
            print("\n5. Создание задачи")
            task_data = {
                "project_id": project_id,
                "data": {
                    "image_url": "https://example.com/test_cat.jpg",
                    "type": "image"
                },
                "metadata": {
                    "priority": "high",
                    "annotator": "test"
                }
            }
            response = requests.post(f"{BASE_URL}/api/v1/tasks/", json=task_data, headers=headers)
            if response.status_code == 201:
                task = response.json()
                print(f"   ✅ Задача создана: ID={task['id']}")
                
                # 7. Получение списка задач
                print("\n6. Получение списка задач")
                response = requests.get(f"{BASE_URL}/api/v1/tasks/", headers=headers)
                if response.status_code == 200:
                    tasks = response.json()
                    print(f"   ✅ Найдено задач: {len(tasks)}")
                
                # 8. Финансовые операции
                print("\n7. Финансовые операции")
                response = requests.get(f"{BASE_URL}/api/v1/finance/wallet", headers=headers)
                if response.status_code == 200:
                    wallet = response.json()
                    print(f"   ✅ Кошелек: баланс={wallet.get('balance', 0)}")
                
                response = requests.post(f"{BASE_URL}/api/v1/finance/deposit?amount=100", headers=headers)
                if response.status_code == 200:
                    print(f"   ✅ Пополнение баланса выполнено")
    
    # 9. Проверка аналитики
    print("\n8. Аналитика")
    response = requests.get(f"{BASE_URL}/api/v1/analytics/dashboard?period=7d", headers=headers if 'headers' in dir() else {})
    if response.status_code in [200, 401]:
        print(f"   ✅ API аналитики доступен (статус: {response.status_code})")
    
    print("\n" + "="*60)
    print("ПРОВЕРКА ЗАВЕРШЕНА")
    print("="*60)

if __name__ == "__main__":
    test_all_services()
