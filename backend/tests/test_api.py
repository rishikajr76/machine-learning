import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient, test_user_payload):
    # 1. Register
    reg_resp = await client.post("/api/v1/auth/register", json=test_user_payload)
    assert reg_resp.status_code == 201
    
    # 2. Login
    login_data = {
        "username": test_user_payload["email"],
        "password": test_user_payload["password"]
    }
    login_resp = await client.post("/api/v1/auth/login", data=login_data)
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    
    # 3. Get Me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_user_payload["email"]

@pytest.mark.asyncio
async def test_create_review_unauthorized(client: AsyncClient):
    payload = {
        "file_path": "test.py",
        "language": "python",
        "original_code": "def foo(): pass"
    }
    response = await client.post("/api/v1/reviews/", json=payload)
    assert response.status_code == 401
