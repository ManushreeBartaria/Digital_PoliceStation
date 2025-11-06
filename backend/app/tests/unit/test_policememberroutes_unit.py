# backend/app/tests/unit/test_policememberroutes_unit.py
from types import SimpleNamespace
from app.api.routes.policememberroutes import get_current_user

def test_policeauth_ok(client, override_db, db_mock):
    override_db()
    member = SimpleNamespace(member_id=7, station_id=2, password="pw", name="Asha")
    db_mock.query.return_value.first.return_value = member
    res = client.post("/policeauth/policeauth", json={"member_id": 7, "station_id": 2, "password": "pw"})
    assert res.status_code == 200
    j = res.json()
    assert j["police_member_id"] == 7
    assert j["station_id"] == 2

def test_policeauth_invalid(client, override_db, db_mock):
    override_db()
    db_mock.query.return_value.first.return_value = None
    res = client.post("/policeauth/policeauth", json={"member_id": 1, "station_id": 1, "password": "bad"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"

def test_get_all_members_ok(client, override_db, dep_override, db_mock):
    override_db()
    dep_override(get_current_user, lambda: {"member_id": 7, "station_id": 2, "name": "Asha"})
    row = SimpleNamespace(member_id=7, station_id=2, name="Asha")
    db_mock.query.return_value.all.return_value = [row]
    res = client.get("/policeauth/allmembers", headers={"Authorization": "Bearer x"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
