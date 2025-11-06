import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ===== utils ===== */
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ===== tiny styles ===== */
const shell = { minHeight: "100vh", background: "#f5f7fb" };
const topbar = {
  background: "#fff",
  borderBottom: "1px solid #e9edf5",
  boxShadow: "0 2px 10px rgba(31,63,174,0.05)",
  padding: "12px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const titleWrap = { display: "flex", alignItems: "center", gap: 14 };
const h1 = { fontSize: 28, fontWeight: 900, color: "#1f3a93", margin: 0 };
const govLabel = { fontWeight: 800, color: "#1f3fae", letterSpacing: 0.2 };

const chip = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  background: "#1f3fae",
  color: "#fff",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(31,63,174,0.18)",
};
const avatar = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#fff",
  color: "#1f3fae",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 12,
};

const page = { padding: "24px 32px" };
const card = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e9edf5",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  padding: 16,
};
const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};
const cardTitle = { fontWeight: 900, color: "#1f3a93", fontSize: 18 };
const list = { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 };
const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  background: "#f7f8fc",
  border: "1px solid #eef2f9",
  borderRadius: 10,
  cursor: "pointer",
};
const smallBtn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #dfe6f6",
  background: "#fff",
  fontWeight: 800,
  color: "#1f3a93",
  cursor: "pointer",
};

export default function GovernmentDashboard() {
  const navigate = useNavigate();

  /* dropdown */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ddRef = useRef(null);

  /* gov identity */
  const [govInfo, setGovInfo] = useState({
    name: "Government",
    government_member_id: "—",
  });

  /* escalations + selection */
  const [loadingEsc, setLoadingEsc] = useState(true);
  const [escalations, setEscalations] = useState([]);

  /* all FIRs */
  const [loadingAll, setLoadingAll] = useState(true);
  const [allFIRs, setAllFIRs] = useState([]);
  const [allError, setAllError] = useState("");

  /* FIR modal */
  const [showModal, setShowModal] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [selected, setSelected] = useState(null); // escalation row (optional)
  const [firDetail, setFirDetail] = useState(null);

  /* outside click for dropdown */
  useEffect(() => {
    const fn = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* read user/token for gov id */
  useEffect(() => {
    let u = null;
    try {
      u = JSON.parse(localStorage.getItem("user") || "null");
    } catch {}
    if (u?.government_member_id) {
      setGovInfo({ name: u.name || "Government", government_member_id: u.government_member_id });
    } else {
      const payload = decodeJwt(localStorage.getItem("token") || "");
      if (payload?.government_member_id) {
        setGovInfo({
          name: "Government",
          government_member_id: payload.government_member_id,
        });
      }
    }
  }, []);

  /* load escalations */
  useEffect(() => {
    (async () => {
      setLoadingEsc(true);
      try {
        const res = await api.get("/government/escalations", {
          params: { status: "all" },
          headers: authHeaders(),
        });
        setEscalations(Array.isArray(res.data) ? res.data : []);
      } catch {
        setEscalations([]);
      } finally {
        setLoadingEsc(false);
      }
    })();
  }, []);

  /* load all FIRs (all stations) */
  useEffect(() => {
    (async () => {
      setLoadingAll(true);
      setAllError("");
      try {
        const res = await api.get("/fir/list", { headers: authHeaders() });
        setAllFIRs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setAllFIRs([]);
        setAllError(
          "Unable to fetch all FIRs with the current role. Ask the backend to permit government access to /fir/list."
        );
      } finally {
        setLoadingAll(false);
      }
    })();
  }, []);

  /* open FIR detail modal by escalation (keeps reason/status) */
  const openEscalation = async (esc) => {
    setSelected(esc);
    await openFIRById(esc.fir_id);
  };

  /* open FIR detail modal by ID (used by All FIRs list) */
  const openFIRById = async (fir_id) => {
    setShowModal(true);
    setFirDetail(null);
    setModalBusy(true);
    try {
      const res = await api.get("/fir/details", {
        params: { fir_id },
        headers: authHeaders(),
      });
      setFirDetail(res.data || null);
    } catch {
      setFirDetail(null);
    } finally {
      setModalBusy(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const initials =
    (govInfo?.name || "G")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div style={shell}>
      {/* ======= RIBBON ======= */}
      <header style={topbar}>
        <div style={titleWrap}>
          <h1 style={h1}>Digital Police Station</h1>
        </div>

        <div ref={ddRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={chip}
            onClick={() => setDropdownOpen((s) => !s)}
            aria-label="Profile menu"
            title="Profile"
          >
            <div style={avatar}>{initials}</div>
            <span style={govLabel}>Government</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}
            >
              <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: 300,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e9edf5",
                boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              <div style={{ display: "flex", gap: 10, padding: 12, background: "#f7f8fc", borderBottom: "1px solid #eef2f9" }}>
                <div style={{ ...avatar, width: 34, height: 34, background: "#1f3fae", color: "#fff" }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 900, color: "#1f3a93" }}>{govInfo.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>Signed In</div>
                </div>
              </div>

              <div style={{ padding: 12, display: "grid", gap: 6 }}>
                <KeyVal k="Role" v="Government" />
                <KeyVal k="Government Member ID" v={govInfo.government_member_id} />
              </div>

              <div style={{ padding: 12, borderTop: "1px solid #eef2f9", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={logout} style={{ ...smallBtn, background: "#c0392b", color: "#fff", border: "none" }}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ======= BODY ======= */}
      <main style={page}>
        {/* Escalations */}
        <section style={{ ...card, marginBottom: 16 }}>
          <div style={cardHeader}>
            <div style={cardTitle}>Escalations</div>
            {loadingEsc ? <span style={{ color: "#6b7890" }}>Loading…</span> : null}
          </div>
          {(!escalations || escalations.length === 0) && !loadingEsc ? (
            <Empty text="No escalations found." />
          ) : (
            <div style={list}>
              {escalations.map((e) => (
                <div key={e.id} style={row} onClick={() => openEscalation(e)} title={`Open FIR ${e.fir_id}`}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>
                      FIR #{e.fir_id} — {e.status?.toUpperCase() || "PENDING"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7890" }}>
                      Aadhar: {e.aadhar_no} • Raised: {new Date(e.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button type="button" style={smallBtn}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All FIRs (All Stations) */}
        <section style={card}>
          <div style={cardHeader}>
            <div style={cardTitle}>All FIRs (All Stations)</div>
            {loadingAll ? <span style={{ color: "#6b7890" }}>Loading…</span> : null}
          </div>

          {allError ? (
            <div style={{ color: "#a94442", fontWeight: 700 }}>{allError}</div>
          ) : (!allFIRs || allFIRs.length === 0) && !loadingAll ? (
            <Empty text="No FIRs found." />
          ) : (
            <div style={list}>
              {allFIRs.map((f) => (
                <div
                  key={f.fir_id}
                  style={row}
                  onClick={() => openFIRById(f.fir_id)}
                  title={`Open FIR ${f.fir_id}`}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>
                      #{f.fir_id} — {f.fullname}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7890" }}>
                      {f.offence_type} • {f.incident_location} • {String(f.status || "active").toUpperCase()} • Station {f.station_id}
                    </div>
                  </div>
                  <button type="button" style={smallBtn}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ======= FIR MODAL ======= */}
      {showModal && (
        <div
          onClick={() => {
            setShowModal(false);
            setSelected(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1000px, 96vw)",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e9edf5",
              boxShadow: "0 20px 44px rgba(0,0,0,0.18)",
              padding: 16,
              maxHeight: "92vh",
              overflow: "auto",
            }}
          >
            <div style={{ ...cardHeader, marginBottom: 12 }}>
              <div style={{ ...cardTitle, fontSize: 20 }}>FIR Details</div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelected(null);
                }}
                style={smallBtn}
              >
                Close
              </button>
            </div>

            {modalBusy ? (
              <div style={{ color: "#6b7890" }}>Loading…</div>
            ) : !firDetail ? (
              <div style={{ color: "#a94442" }}>Unable to load FIR.</div>
            ) : (
              <>
                {/* Basic Info */}
                <div style={{ display: "grid", gap: 8 }}>
                  <KeyVal k="FIR ID" v={firDetail.fir_id} />
                  <KeyVal k="Status" v={String(firDetail.status || "active").toUpperCase()} />
                  <KeyVal k="Complainant" v={firDetail.fullname} />
                  <KeyVal k="Offence" v={firDetail.offence_type} />
                  <KeyVal k="Location" v={firDetail.incident_location} />
                  <KeyVal k="Date/Time" v={`${firDetail.incident_date || ""} ${firDetail.incident_time || ""}`} />
                  <KeyVal k="Aadhar (ID Proof)" v={firDetail.id_proof_value} />
                  <KeyVal k="Station ID" v={firDetail.station_id} />
                  <KeyVal k="Member ID" v={firDetail.member_id} />
                </div>

                {/* Escalation reason (if came via escalation) */}
                {selected?.reason ? (
                  <Block title="Escalation Reason">{selected.reason}</Block>
                ) : null}

                {/* Case narrative */}
                {firDetail.case_narrative ? (
                  <Block title="Case Narrative">{firDetail.case_narrative}</Block>
                ) : null}

                {/* Progress timeline (ALL records) */}
                {Array.isArray(firDetail.progress) && firDetail.progress.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 900, color: "#1f3a93", marginBottom: 6 }}>Progress Timeline</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {firDetail.progress.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: "#f7f8fc",
                            border: "1px solid #eef2f9",
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#6b7890", marginBottom: 4 }}>
                            Updated: {new Date(p.created_at).toLocaleString()}
                          </div>
                          {p.progress_text && <div style={{ fontWeight: 600 }}>{p.progress_text}</div>}
                          {p.evidence_text && (
                            <div style={{ marginTop: 4, fontStyle: "italic" }}>
                              Evidence: {p.evidence_text}
                            </div>
                          )}
                          {p.witness_info && (
                            <div style={{ marginTop: 4 }}>
                              Witness: {p.witness_info}
                            </div>
                          )}
                          {p.other_info && (
                            <div style={{ marginTop: 4 }}>
                              Other: {p.other_info}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Culprit list */}
                {Array.isArray(firDetail.culprits) && firDetail.culprits.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 900, color: "#1f3a93", marginBottom: 6 }}>Culprits</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {firDetail.culprits.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: "#f7f8fc",
                            border: "1px solid #eef2f9",
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{c.name || "Unknown"}</div>
                          <div style={{ fontSize: 12, color: "#6b7890", marginBottom: 6 }}>
                            {c.gender || "—"} • {c.age ?? "—"} • Last known: {c.last_known_location || "—"}
                          </div>
                          {c.address && <KVLine label="Address" value={c.address} />}
                          {c.identity_marks && <KVLine label="Identity Marks" value={c.identity_marks} />}
                          {c.custody_status && <KVLine label="Custody Status" value={c.custody_status} />}
                          {c.details && <KVLine label="Details" value={c.details} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* small helpers */
function KeyVal({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "#6b7890" }}>{k}</span>
      <span style={{ fontWeight: 800, color: "#1f2b50" }}>{v ?? "—"}</span>
    </div>
  );
}
function KVLine({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ width: 150, color: "#6b7890" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
function Empty({ text }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        border: "1px dashed #dfe6f6",
        background: "#fafbff",
        color: "#6b7890",
      }}
    >
      {text}
    </div>
  );
}
function Block({ title, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 900, color: "#1f3a93", marginBottom: 6 }}>{title}</div>
      <div
        style={{
          background: "#f7f8fc",
          border: "1px solid #eef2f9",
          borderRadius: 10,
          padding: 10,
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}
