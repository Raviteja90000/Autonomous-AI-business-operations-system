import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.app.services.seed_service import SeedService
from backend.app.core.security import create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

test_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


from backend.app.core.config import settings


@pytest.fixture(autouse=True)
def force_mock_model_for_tests():
    orig_provider = settings.MODEL_PROVIDER
    settings.MODEL_PROVIDER = "mock"
    yield
    settings.MODEL_PROVIDER = orig_provider


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_factory() as session:
        await SeedService.seed_all(session)
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers() -> dict:
    token = create_access_token({"sub": "admin_test", "email": "admin@ops.ai", "roles": ["ADMIN"]})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def operator_headers() -> dict:
    token = create_access_token({"sub": "operator_test", "email": "operator@ops.ai", "roles": ["OPERATOR"]})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auditor_headers() -> dict:
    token = create_access_token({"sub": "auditor_test", "email": "auditor@ops.ai", "roles": ["AUDITOR"]})
    return {"Authorization": f"Bearer {token}"}
