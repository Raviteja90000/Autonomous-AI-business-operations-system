import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@ops.ai", "password": "AdminPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@ops.ai"
    assert "ADMIN" in data["user"]["roles"]


@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@ops.ai", "password": "WrongPassword!"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_rbac_permission_allowed_for_admin(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/dashboard/overview", headers=admin_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_rbac_permission_denied_for_auditor_on_trigger(client: AsyncClient, auditor_headers: dict):
    # Auditor does NOT have cycle.trigger permission
    response = await client.post(
        "/api/cycles/trigger",
        json={"domain": "sales", "trigger_type": "MANUAL"},
        headers=auditor_headers
    )
    assert response.status_code == 403
