# backend/app/tests/unit/test_models_unit.py
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, time  # <-- added date/time

# Import your models & Base (do NOT import app.main to avoid MySQL side-effects)
from app.database.connection import Base
from app.models.citizen import citizen, CitizenEscalation
from app.models.firregistation import (
    FirRegistration,
    FIRProgress,
    Culprit,
    closedFir,
)
from app.models.government import government, Escalation
from app.models.policemember import PoliceMember


def _make_sqlite_engine():
    # isolated in-memory DB for unit tests
    return create_engine("sqlite:///:memory:")


def _setup_db():
    engine = _make_sqlite_engine()
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return engine, Session


# ---------------------------- citizen.py ---------------------------------

def test_citizen_table_structure():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("citizen_login")
    cols = {c["name"] for c in insp.get_columns("citizen_login")}
    assert {"citizen_id", "aadhar_no", "password"} <= cols

    pks = insp.get_pk_constraint("citizen_login")["constrained_columns"]
    assert pks == ["citizen_id"]


def test_citizen_escalation_composite_pk_and_fk():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("citizen_escalations")
    cols = {c["name"] for c in insp.get_columns("citizen_escalations")}
    assert {"fir_id", "aadhar_no", "reason"} <= cols

    # Composite PK expected: (fir_id, aadhar_no)
    pk_cols = insp.get_pk_constraint("citizen_escalations")["constrained_columns"]
    assert set(pk_cols) == {"fir_id", "aadhar_no"}

    # Foreign key to Fir_Registration.id
    fks = insp.get_foreign_keys("citizen_escalations")
    assert any(
        fk["referred_table"] == "Fir_Registration" and fk["constrained_columns"] == ["fir_id"]
        for fk in fks
    )


# ------------------------- firregistation.py ------------------------------

def test_fir_registration_table_and_relationship_columns():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("Fir_Registration")
    cols = {c["name"] for c in insp.get_columns("Fir_Registration")}
    required = {
        "id", "fullname", "age", "gender", "address", "contact_number",
        "id_proof_type", "id_proof_value", "incident_date", "incident_time",
        "offence_type", "incident_location", "case_narrative", "Stationid", "member_id",
    }
    assert required <= cols

    # member_id FK to PoliceMember.member_id
    fks = insp.get_foreign_keys("Fir_Registration")
    assert any(
        fk["referred_table"] == "PoliceMember" and fk["constrained_columns"] == ["member_id"]
        for fk in fks
    )


def test_fir_progress_table_and_links():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("fir_progress")
    cols = {c["name"] for c in insp.get_columns("fir_progress")}
    assert {
        "id", "fir_id", "progress_text", "evidence_text", "evidence_photos",
        "witness_info", "other_info", "culprit_id", "created_at",
    } <= cols

    fks = insp.get_foreign_keys("fir_progress")
    assert any(
        fk["referred_table"] == "Fir_Registration" and fk["constrained_columns"] == ["fir_id"]
        for fk in fks
    )
    assert any(
        fk["referred_table"] == "culprit" and fk["constrained_columns"] == ["culprit_id"]
        for fk in fks
    )


def test_culprit_table_and_links():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("culprit")
    cols = {c["name"] for c in insp.get_columns("culprit")}
    assert {
        "id", "fir_id", "station_id", "member_id", "name", "age", "gender",
        "address", "identity_marks", "custody_status", "details", "last_known_location",
    } <= cols

    fks = insp.get_foreign_keys("culprit")
    assert any(
        fk["referred_table"] == "Fir_Registration" and fk["constrained_columns"] == ["fir_id"]
        for fk in fks
    )
    assert any(
        fk["referred_table"] == "PoliceMember" and fk["constrained_columns"] == ["member_id"]
        for fk in fks
    )


def test_closed_fir_table_and_link_to_original():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("closed_fir")
    cols = {c["name"] for c in insp.get_columns("closed_fir")}
    assert {
        "id", "fir_id", "fullname", "age", "gender", "address", "contact_number",
        "id_proof_type", "id_proof_value", "incident_date", "incident_time",
        "offence_type", "incident_location", "case_narrative", "closed_at",
        "Stationid", "member_id",
    } <= cols

    fks = insp.get_foreign_keys("closed_fir")
    assert any(
        fk["referred_table"] == "Fir_Registration" and fk["constrained_columns"] == ["fir_id"]
        for fk in fks
    )
    assert any(
        fk["referred_table"] == "PoliceMember" and fk["constrained_columns"] == ["member_id"]
        for fk in fks
    )


# --------------------------- government.py --------------------------------

def test_government_and_escalation_tables():
    engine, Session = _setup_db()
    insp = inspect(engine)

    # government_login table
    assert insp.has_table("government_login")
    gcols = {c["name"] for c in insp.get_columns("government_login")}
    assert {"government_id", "government_member_id", "password"} <= gcols

    # escalations table
    assert insp.has_table("escalations")
    ecols = {c["name"] for c in insp.get_columns("escalations")}
    assert {
        "id", "fir_id", "citizen_id", "aadhar_no", "reason",
        "status", "created_at", "updated_at",
    } <= ecols

    # Verify FK to FIR
    fks = insp.get_foreign_keys("escalations")
    assert any(
        fk["referred_table"] == "Fir_Registration" and fk["constrained_columns"] == ["fir_id"]
        for fk in fks
    )

    # Quick insert to see Python-side defaults populate
    session = Session()
    try:
        # Minimal FIR row to satisfy FK — use real date/time objects for SQLite
        fir = FirRegistration(
            fullname="X",
            age=30,
            gender="M",
            address="A",
            contact_number="1",
            id_proof_type="Aadhar",
            id_proof_value="1111",
            incident_date=date(2025, 1, 1),   # <-- date object
            incident_time=time(10, 0, 0),     # <-- time object
            offence_type="Test",
            incident_location="Loc",
            case_narrative="N",
            Stationid=1,
            member_id=None,
        )
        session.add(fir)
        session.commit()

        esc = Escalation(fir_id=fir.id, aadhar_no="1111", reason="R")
        session.add(esc)
        session.commit()

        assert esc.status in ("pending", None)  # default 'pending' or DB handled
        assert esc.created_at is not None
        assert esc.updated_at is not None
    finally:
        session.close()


# --------------------------- policemember.py -------------------------------

def test_policemember_table_structure():
    engine, _ = _setup_db()
    insp = inspect(engine)

    assert insp.has_table("PoliceMember")
    cols = {c["name"] for c in insp.get_columns("PoliceMember")}
    assert {"member_id", "name", "password", "station_id"} <= cols
