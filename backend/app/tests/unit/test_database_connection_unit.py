# backend/app/tests/unit/test_database_connection_unit.py
from types import SimpleNamespace
import importlib

def test_connection_initializes_engine_session_base(monkeypatch):
    """
    On import, the module should:
    - call sqlalchemy.create_engine(URL)
    - build SessionLocal = sessionmaker(..., bind=engine)
    - set Base = declarative_base()
    We patch SQLAlchemy to avoid any real DB work and assert the calls/values.
    """
    captured = {}

    # Fake bits returned by our patches
    class FakeSession:
        def __init__(self):
            self.closed = False
        def close(self):
            self.closed = True

    def fake_create_engine(url, **kwargs):
        captured["engine_url"] = url
        captured["engine_kwargs"] = kwargs
        return "ENGINE"

    def fake_sessionmaker(**kwargs):
        captured["sessionmaker_kwargs"] = kwargs

        # Return a factory that would be called like SessionLocal()
        def _factory(*_args, **_kwargs):
            return FakeSession()
        return _factory

    def fake_declarative_base():
        return "BASE"

    # Patch the places your module imports from
    monkeypatch.setattr("sqlalchemy.create_engine", fake_create_engine)
    monkeypatch.setattr("sqlalchemy.orm.sessionmaker", fake_sessionmaker)
    monkeypatch.setattr("sqlalchemy.ext.declarative.declarative_base", fake_declarative_base)

    # Import (or reload) the module so its top-level code runs with our patches
    import app.database.connection as connection
    importlib.reload(connection)

    # Assertions
    assert connection.engine == "ENGINE"
    assert connection.Base == "BASE"

    # SessionLocal should be a callable that yields a FakeSession
    sess = connection.SessionLocal()
    assert hasattr(sess, "close") and callable(sess.close)

    # The engine URL should be whatever is defined in the module constant
    assert captured["engine_url"] == connection.SQLALCHEMY_DATABASE_URL
    # And the sessionmaker should have received the bind=engine config
    assert captured["sessionmaker_kwargs"]["autocommit"] is False
    assert captured["sessionmaker_kwargs"]["autoflush"] is False
    assert captured["sessionmaker_kwargs"]["bind"] == "ENGINE"


def test_get_db_yields_and_closes_session(monkeypatch):
    """
    get_db() should yield a session and ALWAYS close it in finally.
    We'll replace SessionLocal with a fake factory that tracks close().
    """
    import app.database.connection as connection

    class FakeSession:
        def __init__(self):
            self.closed = False
        def close(self):
            self.closed = True

    # Make SessionLocal() return a new FakeSession each time
    monkeypatch.setattr(connection, "SessionLocal", lambda: FakeSession())

    gen = connection.get_db()
    # get the yielded session
    db = next(gen)
    assert isinstance(db, FakeSession)
    assert db.closed is False

    # Closing the generator should trigger the finally: db.close()
    gen.close()
    assert db.closed is True
