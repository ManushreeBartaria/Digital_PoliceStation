# backend/app/tests/unit/test_schemas_unit.py
from types import SimpleNamespace
from datetime import date, time, datetime
import pytest
from pydantic import ValidationError

# ---- citizen.py ----
from app.schemas.citizen import (
    citizenCreate,
    citizenResponse,
    citizenAuth,
    citizenauthresponse,
    EscalationCreate,
    EscalationRecord,
)

# ---- Fir.py ----
from app.schemas.Fir import (
    FirCreate,
    FirResponse,
    CulpritCreate,
    FIRProgressUpdate,
    FIRProgressRecord,
    FIRProgressRequest,
    FIRProgressResponse,
    FIRCloseRequest,
    FIRCloseResponse,
    CulpritRecord,
    FIRDetailsResponse,
)

# ---- government.py ----
from app.schemas.goverment import (
    govermentCreate,
    governmentResponse,
    governmentAuth,
    governmentauthresponse,
    governmentsearchfir,
    governmentsearchfirresponse,
    escalateFIRRequest,
    escalateFIRResponse,
    EscalationCreate as GovEscalationCreate,
    EscalationRecord as GovEscalationRecord,
)

# ---- PoliceMemberCreate.py ----
from app.schemas.PoliceMemberCreate import (
    PoliceMemberCreate,
    PoliceMemberResponse,
    PoliceAuth,
    PoliceAuthResponse,
    MemberDetails,
)

# =====================================================================================
# citizen.py
# =====================================================================================

def test_citizen_create_trims_and_validates():
    m = citizenCreate(aadhar_no=" 123456 ", password="  secret  ")
    assert m.aadhar_no == "123456"
    assert m.password == "secret"

def test_citizen_create_invalid_short_aadhar():
    with pytest.raises(ValidationError):
        citizenCreate(aadhar_no="12", password="x")

def test_citizen_auth_trims_and_validates():
    m = citizenAuth(aadhar_no=" 9999 ", password="  pw ")
    assert m.aadhar_no == "9999"
    assert m.password == "pw"

def test_citizen_response_from_attributes():
    src = SimpleNamespace(message="ok", citizen_id=42)
    model = citizenResponse.model_validate(src, from_attributes=True)
    assert model.citizen_id == 42 and model.message == "ok"

def test_citizenauthresponse_ok():
    r = citizenauthresponse(
        access_token="tok", token_type="bearer", citizen_id=5, aadhar_no="1234"
    )
    assert r.token_type == "bearer"
    assert r.citizen_id == 5

def test_citizen_escalation_create_trims_and_minlen():
    with pytest.raises(ValidationError):
        EscalationCreate(fir_id="F1", reason="")  # min_length=1

    e = EscalationCreate(fir_id=" F1 ", reason="  Delay in action ")
    assert e.fir_id == "F1" and e.reason == "Delay in action"

def test_citizen_escalation_record_from_attributes():
    src = SimpleNamespace(fir_id="F9", aadhar_no="A1", reason="R")
    model = EscalationRecord.model_validate(src, from_attributes=True)
    assert model.fir_id == "F9" and model.reason == "R"


# =====================================================================================
# Fir.py
# =====================================================================================

def test_fir_create_accepts_date_time():
    f = FirCreate(
        fullname="John",
        age=30,
        gender="M",
        address="addr",
        contact_number="1",
        id_proof_type="Aadhar",
        id_proof_value="1111",
        incident_date=date(2025, 1, 1),
        incident_time=time(10, 0),
        offence_type="Theft",
        incident_location="Loc",
        case_narrative="Narr",
    )
    assert f.incident_date == date(2025, 1, 1)
    assert f.incident_time == time(10, 0)

def test_fir_response_from_attributes():
    src = SimpleNamespace(message="ok", report_id="RID", registered_by_id=9, registered_by_name="Raj")
    model = FirResponse.model_validate(src, from_attributes=True)
    assert model.report_id == "RID" and model.registered_by_name == "Raj"

def test_progress_update_optional_fields_and_nested():
    upd = FIRProgressUpdate(
        fir_id="F1",
        culprit=CulpritCreate(name="X", age=21),
        progress_text=None,
        evidence_photos=None,
    )
    assert upd.culprit.name == "X"
    assert upd.progress_text is None

def test_progress_record_requires_created_at():
    with pytest.raises(ValidationError):
        FIRProgressRecord(
            id=1,
            progress_text="p",
            evidence_text=None,
            evidence_photos=None,
            witness_info=None,
            other_info=None,
            culprit_id=None,
            # created_at missing
        )

    rec = FIRProgressRecord(
        id=2,
        progress_text="p2",
        evidence_text="e2",
        evidence_photos="",
        witness_info="",
        other_info="",
        culprit_id=None,
        created_at=datetime(2025, 1, 1, 10, 0),
    )
    assert isinstance(rec.created_at, datetime)

def test_progress_response_from_attributes_list():
    src = SimpleNamespace(
        progress=[
            SimpleNamespace(
                id=1, progress_text="p", evidence_text=None, evidence_photos=None,
                witness_info=None, other_info=None, culprit_id=None,
                created_at=datetime(2025, 1, 1, 10, 0)
            )
        ]
    )
    model = FIRProgressResponse.model_validate(src, from_attributes=True)
    assert len(model.progress) == 1
    assert model.progress[0].id == 1

def test_close_fir_schemas():
    req = FIRCloseRequest(fir_id="F1")
    res = FIRCloseResponse(message="done")
    assert req.fir_id == "F1" and res.message == "done"

def test_fir_details_response_from_attributes():
    src = SimpleNamespace(
        fir_id="F1",
        fullname="A",
        age=23,
        gender="F",
        address="Addr",
        contact_number="1",
        id_proof_type="Aadhar",
        id_proof_value="1111",
        incident_date=date(2025, 1, 1),
        incident_time=time(10, 0),
        offence_type="Theft",
        incident_location="Loc",
        case_narrative="Narr",
        station_id=1,
        member_id=2,
        status="active",
        progress=[
            SimpleNamespace(
                id=1, progress_text="p", evidence_text=None, evidence_photos=None,
                witness_info=None, other_info=None, culprit_id=None,
                created_at=datetime(2025, 1, 1, 10, 0)
            )
        ],
        culprits=[SimpleNamespace(id=1, name="X", age=None, gender=None, address=None,
                                  identity_marks=None, custody_status=None, details=None,
                                  last_known_location=None)],
    )
    model = FIRDetailsResponse.model_validate(src, from_attributes=True)
    assert model.fir_id == "F1"
    assert model.progress[0].id == 1
    assert model.culprits[0].name == "X"


# =====================================================================================
# goverment.py
# =====================================================================================

def test_government_auth_models():
    _ = govermentCreate(government_member_id=10, password="pw")
    _ = governmentAuth(government_member_id=10, password="pw")
    resp = governmentauthresponse(access_token="tok", token_type="bearer")
    assert resp.token_type == "bearer"

def test_government_search_response_uses_fircreate():
    f = FirCreate(
        fullname="John",
        age=30,
        gender="M",
        address="addr",
        contact_number="1",
        id_proof_type="Aadhar",
        id_proof_value="1111",
        incident_date=date(2025, 1, 1),
        incident_time=time(10, 0),
        offence_type="Theft",
        incident_location="Loc",
        case_narrative="Narr",
    )
    model = governmentsearchfirresponse(fir=[f])
    assert len(model.fir) == 1 and model.fir[0].fullname == "John"

def test_gov_escalation_create_min_length_reason():
    with pytest.raises(ValidationError):
        GovEscalationCreate(fir_id="F1", reason="short")  # min_length=10

    ok = GovEscalationCreate(fir_id="F1", reason="Valid reason text")
    assert ok.reason.startswith("Valid")

def test_gov_escalation_record_from_attributes():
    src = SimpleNamespace(
        id=1, fir_id="F1", citizen_id=None, aadhar_no="1111",
        reason="R", status="pending",
        created_at=datetime(2025, 1, 1, 10, 0),
        updated_at=datetime(2025, 1, 1, 11, 0),
    )
    model = GovEscalationRecord.model_validate(src, from_attributes=True)
    assert model.id == 1 and model.status == "pending"

def test_government_response_basic():
    r = governmentResponse(message="ok")
    assert r.message == "ok"

def test_government_lookup_request_response_types():
    req = escalateFIRRequest(fir_id="F1")
    assert req.fir_id == "F1"
    # response uses FirCreate
    f = FirCreate(
        fullname="John",
        age=30,
        gender="M",
        address="addr",
        contact_number="1",
        id_proof_type="Aadhar",
        id_proof_value="1111",
        incident_date=date(2025, 1, 1),
        incident_time=time(10, 0),
        offence_type="Theft",
        incident_location="Loc",
        case_narrative="Narr",
    )
    res = escalateFIRResponse(fir=f)
    assert res.fir.fullname == "John"


# =====================================================================================
# PoliceMemberCreate.py
# =====================================================================================

def test_police_member_create_and_response():
    c = PoliceMemberCreate(name="Asha", password="pw", station_id=2)
    assert c.station_id == 2
    r = PoliceMemberResponse(message="Created", member_id=7)
    assert r.member_id == 7

def test_police_auth_and_response():
    a = PoliceAuth(station_id=2, member_id=7, password="pw")
    assert a.member_id == 7
    ar = PoliceAuthResponse(
        access_token="tok",
        token_type="bearer",
        police_member_id=7,
        station_id=2,
        name="Asha",
    )
    assert ar.name == "Asha"

def test_member_details_from_attributes():
    src = SimpleNamespace(name="Ravi")
    m = MemberDetails.model_validate(src, from_attributes=True)
    assert m.name == "Ravi"
