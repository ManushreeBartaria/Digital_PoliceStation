# backend/app/tests/conftest.py
import os
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import os, sys
THIS_DIR = os.path.dirname(os.path.abspath(__file__))           # .../backend/app/tests
APP_DIR = os.path.dirname(THIS_DIR)                              # .../backend/app
PROJECT_ROOT = os.path.dirname(APP_DIR)                          # .../backend
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.main import app
from app.database.connection import get_db

@pytest.fixture(scope="session", autouse=True)
def _unit_env():
    os.environ["TESTING"] = "1"
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# ---------- DB mock ----------
def _mk_chain():
    q = MagicMock(name="query()")
    q.filter.return_value = q
    q.order_by.return_value = q
    q.filter_by = q.filter
    q.first.return_value = None
    q.all.return_value = []
    return q

@pytest.fixture
def db_mock():
    session = MagicMock(name="Session")
    session.query.return_value = _mk_chain()
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.flush = MagicMock()
    return session

@pytest.fixture
def override_db(db_mock):
    def _install(mock=db_mock):
        app.dependency_overrides[get_db] = lambda: mock
        return mock
    yield _install
    app.dependency_overrides.pop(get_db, None)

# ---------- Generic dependency override helper ----------
@pytest.fixture
def dep_override():
    regs = []
    def _set(dep, provider):
        app.dependency_overrides[dep] = provider
        regs.append(dep)
    yield _set
    for d in regs:
        app.dependency_overrides.pop(d, None)
