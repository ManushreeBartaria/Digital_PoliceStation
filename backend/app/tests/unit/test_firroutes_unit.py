# backend/app/tests/unit/test_firroutes_unit.py
from types import SimpleNamespace
from datetime import datetime
from app.api.routes.firroutes import get_current_police


def test_register_incident_ok(client, override_db, dep_override, db_mock):
    override_db()
    dep_override(get_current_police, lambda: {"id": 11, "name": "Raj", "station_id": 5})

    def _refresh(obj):
        setattr(obj, "id", "RID1")
    db_mock.refresh.side_effect = _refresh

    payload = {
        "fullname": "John Doe",
        "age": 30,
        "gender": "M",
        "address": "addr",
        "contact_number": "123",
        "id_proof_type": "Aadhar",
        "id_proof_value": "A1",
        "incident_date": "2025-01-01",
        "incident_time": "10:00",
        "offence_type": "Theft",
        "incident_location": "Market",
        "case_narrative": "desc",
    }
    res = client.post("/fir/register_incident", json=payload)
    assert res.status_code in (200, 201)
    assert res.json()["report_id"] == "RID1"
    assert res.json()["registered_by_id"] == 11


def test_get_progress_404_when_fir_missing(client, override_db, db_mock):
    override_db()
    db_mock.query.return_value.first.return_value = None
    res = client.post("/fir/get_progress", json={"fir_id": "X"})
    assert res.status_code == 404
    assert res.json()["detail"] == "FIR not found"


def test_get_progress_returns_records(client, override_db, db_mock):
    override_db()
    # FIR exists
    db_mock.query.return_value.first.return_value = SimpleNamespace(id="F1")

    # Records must satisfy FIRProgress schema fields (not MagicMocks)
    rec1 = SimpleNamespace(
        id=2,
        progress_text="p2",
        evidence_text="e2",
        evidence_photos="",
        witness_info="",
        other_info="",
        culprit_id=None,
        fir_id="F1",
        created_at=datetime(2025, 1, 2, 10, 0, 0),
    )
    rec2 = SimpleNamespace(
        id=1,
        progress_text="p1",
        evidence_text="e1",
        evidence_photos="",
        witness_info="",
        other_info="",
        culprit_id=None,
        fir_id="F1",
        created_at=datetime(2025, 1, 1, 9, 0, 0),
    )
    db_mock.query.return_value.all.return_value = [rec1, rec2]

    res = client.post("/fir/get_progress", json={"fir_id": "F1"})
    assert res.status_code == 200
    data = res.json()
    assert "progress" in data and len(data["progress"]) == 2
    assert data["progress"][0]["created_at"]
    assert data["progress"][1]["created_at"]


def test_list_all_firs_unauthorized(client, override_db, db_mock):
    override_db()
    res = client.get("/fir/list")
    assert res.status_code == 401
    # When no Authorization header is present, OAuth2PasswordBearer yields:
    assert res.json()["detail"] == "Not authenticated"
