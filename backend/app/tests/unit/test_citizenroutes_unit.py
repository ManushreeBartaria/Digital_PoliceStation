# backend/app/tests/unit/test_citizenroutes_unit.py
from types import SimpleNamespace
from unittest.mock import MagicMock
from app.api.routes.citizenroutes import get_current_citizen

# Aadhaar/pw that satisfy your schema validators
AADHAAR = "123456789012"
PWD = "pass1234"

def test_add_citizen_success(client, override_db, db_mock):
    override_db()
    chain = db_mock.query.return_value
    chain.first.return_value = None

    # set citizen_id on refresh so response_model validates
    def _refresh(obj):
        setattr(obj, "citizen_id", 101)
    db_mock.refresh.side_effect = _refresh

    payload = {"aadhar_no": AADHAAR, "password": PWD}
    res = client.post("/citizen/addcitizen", json=payload)
    assert res.status_code in (200, 201)
    j = res.json()
    assert j["citizen_id"] == 101

def test_add_citizen_existing_conflict(client, override_db, db_mock):
    override_db()
    chain = db_mock.query.return_value
    chain.first.return_value = SimpleNamespace()  # existing citizen
    res = client.post("/citizen/addcitizen", json={"aadhar_no": AADHAAR, "password": PWD})
    assert res.status_code == 409
    assert res.json()["detail"] == "Citizen with this Aadhar already exists"

def test_citizen_auth_invalid(client, override_db, db_mock):
    override_db()
    chain = db_mock.query.return_value
    chain.first.return_value = None  # no match -> 401
    res = client.post("/citizen/citizenAuth", json={"aadhar_no": AADHAAR, "password": "wrongpass"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"

def test_citizen_escalate_create_ok(client, override_db, dep_override, db_mock):
    override_db()
    # Bypass OAuth by overriding the dependency:
    dep_override(get_current_citizen, lambda: {"citizen_id": 9, "aadhar_no": "A1"})

    fir_obj = SimpleNamespace(id="F123", id_proof_value="A1", Stationid=1, member_id=1)
    chain = db_mock.query.return_value
    chain.first.side_effect = [
        fir_obj,  # FirRegistration
        None      # Escalation not present
    ]
    res = client.post("/citizen/escalatefir", json={"fir_id": "F123", "reason": "Delay"})
    assert res.status_code in (200, 201)
    assert res.json()["fir_id"] == "F123"

def test_citizen_escalate_updates_existing(client, override_db, dep_override, db_mock):
    override_db()
    dep_override(get_current_citizen, lambda: {"citizen_id": 9, "aadhar_no": "A1"})

    fir_obj = SimpleNamespace(id="F1", id_proof_value="A1")
    existing = SimpleNamespace(fir_id="F1", aadhar_no="A1", reason="old")
    chain = db_mock.query.return_value
    chain.first.side_effect = [fir_obj, existing]
    res = client.post("/citizen/escalatefir", json={"fir_id": "F1", "reason": "New reason"})
    assert res.status_code == 200
    assert res.json()["reason"] == "New reason"

def test_citizen_escalate_unauthorized_if_not_owner(client, override_db, dep_override, db_mock):
    override_db()
    dep_override(get_current_citizen, lambda: {"citizen_id": 9, "aadhar_no": "A1"})
    fir_obj = SimpleNamespace(id="F9", id_proof_value="ZZZ")
    db_mock.query.return_value.first.side_effect = [fir_obj]
    res = client.post("/citizen/escalatefir", json={"fir_id": "F9", "reason": "x"})
    assert res.status_code == 403
    assert res.json()["detail"] == "You are not authorized to escalate this FIR"
