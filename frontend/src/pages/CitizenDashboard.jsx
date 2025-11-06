import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import routes from "../services/routes";

export default function CitizenDashboard() {
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { name: "Citizen" };
  });

  // My FIRs
  const [loading, setLoading] = useState(true);
  const [myFIRs, setMyFIRs] = useState([]);

  // Detail modal
  const [showDetails, setShowDetails] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState(null);
  const [firDetail, setFirDetail] = useState(null);

  // Escalation
  const [escalate, setEscalate] = useState({ fir_id: "", aadhar_no: "", reason: "" });
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const initials =
    (user?.name || "Citizen")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "C";

  // Load citizen FIRs
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      logout();
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const list = await routes.getCitizenFIRs(); // GET /fir/list_by_aadhar
        setMyFIRs(Array.isArray(list) ? list : []);
      } catch {
        setMyFIRs([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (fir) => {
    setSelectedFIR(fir);
    setShowDetails(true);
    setDetailLoading(true);
    setFirDetail(null);
    try {
      const data = await routes.getFIRDetail(fir.fir_id); // GET /fir/detail/{id}
      setFirDetail(data || null);
    } catch {
      setFirDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitEscalation = async (e) => {
    e.preventDefault();
    if (!escalate.fir_id.trim() || !escalate.aadhar_no.trim() || !escalate.reason.trim()) {
      alert("Please fill FIR ID, Aadhar No and the reason to escalate.");
      return;
    }
    setEscalating(true);
    try {
      await routes.escalateFIR({
        fir_id: escalate.fir_id.trim(),
        aadhar_no: escalate.aadhar_no.trim(),
        reason: escalate.reason.trim(),
      });
      alert("Your escalation has been submitted.");
      setEscalate({ fir_id: "", aadhar_no: "", reason: "" });
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to escalate case");
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* No citizen sidebar for now */}
      <aside className="sidebar" style={{ width: 0, padding: 0, boxShadow: "none" }} />

      <div className="dashboard-content">
        {/* Ribbon */}
        <header className="navbar">
          <div className="nav-left">
            <h1>Digital Police Station</h1>
          </div>

          <div className="nav-right" ref={dropdownRef}>
            <span className="nav-username" title={user?.name || "Citizen"}>
              {user?.name || "Citizen"}
            </span>
            <div
              className="profile-icon profile-elevated"
              role="button"
              aria-label="Profile menu"
              onClick={() => setDropdownOpen((s) => !s)}
            >
              {initials}
            </div>

            {dropdownOpen && (
              <div className="dropdown-menu pretty">
                <div className="dropdown-header">
                  <div className="avatar">{initials}</div>
                  <div className="meta">
                    <div className="officer-name" title={user?.name || "Citizen"}>
                      {user?.name || "Citizen"}
                    </div>
                    <div className="status-badge">Signed In</div>
                  </div>
                </div>

                <div className="dropdown-section">
                  <div className="kv">
                    <span className="k">Role</span>
                    <span className="v">Citizen</span>
                  </div>
                  <div className="kv">
                    <span className="k">Citizen ID</span>
                    <span className="v">{user?.citizen_id ?? "—"}</span>
                  </div>
                </div>

                <button className="dropdown-item logout-strong" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main style={{ padding: "16px 24px 24px" }}>
          {/* My FIRs */}
          <section style={cardStyle}>
            <div style={cardHeader}>
              <div style={cardTitle}>My FIRs</div>
              {loading && <span className="loading-text">Loading…</span>}
            </div>

            {(!myFIRs || myFIRs.length === 0) && !loading ? (
              <p style={{ color: "#666", margin: 0 }}>No FIRs found.</p>
            ) : (
              <ul style={listStyle}>
                {myFIRs.map((f) => (
                  <li
                    key={f.fir_id}
                    style={listItem}
                    onClick={() => openDetail(f)}
                    title={`FIR #${f.fir_id}`}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {f.offence_type ? `${f.offence_type} — ${f.fullname}` : `FIR #${f.fir_id}`}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#666" }}>
                      <span>#{f.fir_id}</span>
                      <span>• {f.incident_location || "—"}</span>
                      <span>
                        •{" "}
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background:
                              String(f.status).toLowerCase() === "closed"
                                ? "#fdecea"
                                : "#e8f5e9",
                            color:
                              String(f.status).toLowerCase() === "closed"
                                ? "#c0392b"
                                : "#2e7d32",
                            fontWeight: 700,
                          }}
                        >
                          {String(f.status || "active").toUpperCase()}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Escalate Case */}
          <section style={{ ...cardStyle, marginTop: 20 }}>
            <div style={cardHeader}>
              <div style={cardTitle}>Escalate Case</div>
            </div>

            <p style={{ marginTop: 0, color: "#5b6b8c" }}>
              If you are not satisfied with the inquiry and your case has been closed, you may request
              a review by submitting the FIR ID, your Aadhar number, and the reason for escalation.
            </p>

            <form onSubmit={submitEscalation}>
              <div style={grid2}>
                <div>
                  <label>FIR ID</label>
                  <input
                    className="modal-input"
                    value={escalate.fir_id}
                    onChange={(e) => setEscalate((p) => ({ ...p, fir_id: e.target.value }))}
                    placeholder="Paste full FIR ID"
                  />
                </div>
                <div>
                  <label>Aadhar Number</label>
                  <input
                    className="modal-input"
                    value={escalate.aadhar_no}
                    onChange={(e) => setEscalate((p) => ({ ...p, aadhar_no: e.target.value }))}
                    placeholder="Your Aadhar (must match the FIR)"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Reason / Description</label>
                  <textarea
                    className="modal-input"
                    rows={4}
                    value={escalate.reason}
                    onChange={(e) => setEscalate((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Describe why you are requesting escalation…"
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 10 }}>
                <button type="submit" className="btn-primary" disabled={escalating}>
                  {escalating ? "Submitting…" : "Escalate"}
                </button>
              </div>

              <p style={{ marginTop: 10, color: "#a94442", fontWeight: 600 }}>
                Note: Do not misuse this option. Submitting false or prank escalations may result in
                strict action.
              </p>
            </form>
          </section>
        </main>
      </div>

      {/* ----- Detail Modal ----- */}
      {showDetails && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">FIR Details</div>
            {detailLoading ? (
              <div className="loading-text">Loading…</div>
            ) : !firDetail ? (
              <div style={{ color: "#777" }}>Unable to load this FIR.</div>
            ) : (
              <>
                <div className="fir-meta" style={{ display: "grid", gap: 6 }}>
                  <div><strong>FIR ID:</strong> {firDetail.fir_id}</div>
                  <div><strong>Status:</strong> {String(firDetail.status || "active").toUpperCase()}</div>
                  <div><strong>Complainant:</strong> {firDetail.fullname}</div>
                  <div><strong>Offence:</strong> {firDetail.offence_type}</div>
                  <div><strong>Location:</strong> {firDetail.incident_location}</div>
                  <div><strong>Date/Time:</strong> {firDetail.incident_date} {firDetail.incident_time}</div>
                </div>

                <div className="fir-section" style={{ marginTop: 12 }}>
                  <div className="section-title">Case Narrative</div>
                  <div style={{ background: "#f7f8fc", border: "1px solid #eef0f6", borderRadius: 8, padding: 10 }}>
                    {firDetail.case_narrative || "—"}
                  </div>
                </div>

                <div className="fir-section" style={{ marginTop: 12 }}>
                  <div className="section-title">Latest Progress</div>
                  {firDetail.progress ? (
                    <div style={{ background: "#f7f8fc", border: "1px solid #eef0f6", borderRadius: 8, padding: 10 }}>
                      {typeof firDetail.progress === "string" || typeof firDetail.progress === "number"
                        ? String(firDetail.progress)
                        : JSON.stringify(firDetail.progress)}
                    </div>
                  ) : (
                    <div style={{ color: "#777" }}>No progress recorded yet.</div>
                  )}
                </div>

                <div className="modal-actions" style={{ marginTop: 12 }}>
                  <button className="btn-secondary" onClick={() => setShowDetails(false)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* tiny inline styles */
const cardStyle = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  padding: 16,
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const cardTitle = {
  fontWeight: 700,
  fontSize: 18,
  color: "#1f3a93",
};

const listStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const listItem = {
  background: "#f7f8fc",
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
  border: "1px solid #eef0f6",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};
