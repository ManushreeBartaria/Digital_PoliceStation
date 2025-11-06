# backend/app/tests/unit/test_governmentroutes_unit.py
from types import SimpleNamespace
from app.api.routes.governmentroutes import get_current_government

def test_government_auth_and_list_escalations(client, override_db, dep_override, db_mock):
    override_db()

    # ---- /government/governmentAuth (no auth dep here) ----
    db_mock.query.return_value.first.return_value = SimpleNamespace(government_member_id=10, password="pw")
    res = client.post("/government/governmentAuth", json={"government_member_id": 10, "password": "pw"})
    assert res.status_code == 200
    assert "access_token" in res.json()

    # ---- /government/escalations (auth required) ----
    dep_override(get_current_government, lambda: {"government_member_id": 5})
    item = SimpleNamespace(
        id=1, fir_id="F1", citizen_id=9, aadhar_no="A1", reason="Delay",
        status="pending", created_at="t1", updated_at="t2"
    )
    db_mock.query.return_value.all.return_value = [item]
    res2 = client.get("/government/escalations", headers={"Authorization": "Bearer x"})
    assert res2.status_code == 200
    assert res2.json()[0]["fir_id"] == "F1"
