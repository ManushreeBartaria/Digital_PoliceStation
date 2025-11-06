// src/pages/PoliceDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import routes from "../services/routes";

export default function PoliceDashboard() {
  const navigate = useNavigate();

  /* ====== auth / profile ====== */
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ====== members ====== */
  const [members, setMembers] = useState([]);

  /* ====== dropdown ====== */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* ====== FIR lists ====== */
  const [activeFIRs, setActiveFIRs] = useState([]);
  const [closedFIRs, setClosedFIRs] = useState([]);
  const [allStationFIRs, setAllStationFIRs] = useState([]);
  const [loadingFIRs, setLoadingFIRs] = useState(true);

  /* ====== Search (compact button → panel) ====== */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchWrapRef = useRef(null);

  /* ====== File FIR (multi-step) ====== */
  const [showFileModal, setShowFileModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [filing, setFiling] = useState(false);
  const [fileForm, setFileForm] = useState({
    fullname: "",
    age: "",
    gender: "",
    address: "",
    contact_number: "",
    id_proof_type: "",
    id_proof_value: "",
    incident_date: "",
    incident_time: "",
    offence_type: "",
    incident_location: "",
    case_narrative: "",
  });

  /* ====== FIR details / progress composer ====== */
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState(null); // minimal card data
  const [firDetails, setFIRDetails] = useState(null); // full record from backend
  const [detailsLoading, setDetailsLoading] = useState(false);

  // progress composer (all optional)
  const [progressForm, setProgressForm] = useState({
    progress_text: "",
    evidence_text: "",
    evidence_photos: "",
    witness_info: "",
    other_info: "",
    culprit_open: false,
    culprit: {
      name: "",
      age: "",
      gender: "",
      address: "",
      identity_marks: "",
      custody_status: "",
      details: "",
      last_known_location: "",
    },
  });
  const [savingProgress, setSavingProgress] = useState(false);
  const [closing, setClosing] = useState(false);

  /* ---------- effects ---------- */

  // dropdown outside click
  useEffect(() => {
    function onClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // search panel outside click
  useEffect(() => {
    function onClick(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  // boot
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        logout();
      }
    } else {
      logout();
    }

    async function fetchMembers() {
      try {
        const res = await api.get("/policeauth/allmembers", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setMembers(res.data || []);
      } catch (err) {
        if (err?.response?.status === 401) logout();
      }
    }

    async function fetchFIRs() {
      setLoadingFIRs(true);
      try {
        const data = await routes.getFIRsByStation();
        setActiveFIRs(Array.isArray(data?.active) ? data.active : []);
        setClosedFIRs(Array.isArray(data?.closed) ? data.closed : []);
        setAllStationFIRs(Array.isArray(data?.all) ? data.all : []);
      } catch {
        setActiveFIRs([]);
        setClosedFIRs([]);
        setAllStationFIRs([]);
      } finally {
        setLoadingFIRs(false);
      }
    }

    if (!token) {
      logout();
      return;
    }
    fetchMembers();
    fetchFIRs();
  }, [token]); // eslint-disable-line

  const initials = (user?.name || "Officer")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  /* ---------- File FIR ---------- */

  const resetFileForm = () =>
    setFileForm({
      fullname: "",
      age: "",
      gender: "",
      address: "",
      contact_number: "",
      id_proof_type: "",
      id_proof_value: "",
      incident_date: "",
      incident_time: "",
      offence_type: "",
      incident_location: "",
      case_narrative: "",
    });

  const requiredStep1 = ["fullname", "age", "gender", "address", "contact_number", "id_proof_type"];
  const requiredStep2 = ["incident_date", "incident_time", "offence_type", "incident_location"];
  const requiredStep3 = ["case_narrative"];

  const validateStep = (step) => {
    const pick = step === 0 ? requiredStep1 : step === 1 ? requiredStep2 : requiredStep3;
    const missing = pick.filter((k) => !String(fileForm[k] ?? "").trim());
    if (missing.length) {
      alert(`Please fill all required fields:\n${missing.join(", ")}`);
      return false;
    }
    if (step === 0 && isNaN(Number(fileForm.age))) {
      alert("Age must be a number.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(2, s + 1));
  };
  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1));

  const handleFileFIR = async (e) => {
    e?.preventDefault();
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;

    const payload = {
      fullname: fileForm.fullname.trim(),
      age: Number(fileForm.age),
      gender: fileForm.gender.trim(),
      address: fileForm.address.trim(),
      contact_number: fileForm.contact_number.trim(),
      id_proof_type: fileForm.id_proof_type.trim(),
      id_proof_value: fileForm.id_proof_value ? fileForm.id_proof_value.trim() : null,
      incident_date: fileForm.incident_date,
      incident_time: fileForm.incident_time,
      offence_type: fileForm.offence_type.trim(),
      incident_location: fileForm.incident_location.trim(),
      case_narrative: fileForm.case_narrative.trim(),
    };

    setFiling(true);
    try {
      const data = await routes.registerIncident(payload);
      const newFIR = {
        fir_id: data?.report_id,
        status: "active",
        incident_location: payload.incident_location,
        case_narrative: payload.case_narrative,
        offence_type: payload.offence_type,
        fullname: payload.fullname,
        created_at: new Date().toISOString(),
      };
      setActiveFIRs((prev) => [newFIR, ...prev]);
      setAllStationFIRs((prev) => [newFIR, ...prev]);
      setShowFileModal(false);
      resetFileForm();
      setCurrentStep(0);
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to register FIR");
    } finally {
      setFiling(false);
    }
  };

  /* ---------- Search ---------- */

  const submitSearch = async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await routes.searchFIRs(q);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  /* ---------- Details & Progress ---------- */

  const openFIRDetails = async (firCard) => {
    setSelectedFIR(firCard);
    setShowDetails(true);
    setDetailsLoading(true);
    setFIRDetails(null);
    setProgressForm({
      progress_text: "",
      evidence_text: "",
      evidence_photos: "",
      witness_info: "",
      other_info: "",
      culprit_open: false,
      culprit: {
        name: "",
        age: "",
        gender: "",
        address: "",
        identity_marks: "",
        custody_status: "",
        details: "",
        last_known_location: "",
      },
    });

    try {
      const full = await routes.getFIRDetails(firCard.fir_id);
      setFIRDetails(full || null);
    } catch {
      setFIRDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitProgress = async () => {
    if (!selectedFIR?.fir_id) return;
    setSavingProgress(true);

    const payload = {
      fir_id: String(selectedFIR.fir_id),
      progress_text: progressForm.progress_text?.trim() || undefined,
      evidence_text: progressForm.evidence_text?.trim() || undefined,
      evidence_photos: progressForm.evidence_photos?.trim() || undefined,
      witness_info: progressForm.witness_info?.trim() || undefined,
      other_info: progressForm.other_info?.trim() || undefined,
      culprit:
        progressForm.culprit_open &&
        (progressForm.culprit.name ||
          progressForm.culprit.age ||
          progressForm.culprit.gender ||
          progressForm.culprit.address ||
          progressForm.culprit.identity_marks ||
          progressForm.culprit.custody_status ||
          progressForm.culprit.details ||
          progressForm.culprit.last_known_location)
          ? {
              name: progressForm.culprit.name?.trim() || undefined,
              age: progressForm.culprit.age ? Number(progressForm.culprit.age) : undefined,
              gender: progressForm.culprit.gender?.trim() || undefined,
              address: progressForm.culprit.address?.trim() || undefined,
              identity_marks: progressForm.culprit.identity_marks?.trim() || undefined,
              custody_status: progressForm.culprit.custody_status?.trim() || undefined,
              details: progressForm.culprit.details?.trim() || undefined,
              last_known_location: progressForm.culprit.last_known_location?.trim() || undefined,
            }
          : undefined,
    };

    try {
      await routes.addProgress(payload);
      // refresh details to show the new progress
      const full = await routes.getFIRDetails(selectedFIR.fir_id);
      setFIRDetails(full || null);
      setProgressForm((p) => ({ ...p, progress_text: "", evidence_text: "", evidence_photos: "", witness_info: "", other_info: "" }));
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to add progress");
    } finally {
      setSavingProgress(false);
    }
  };

  const closeSelectedFIR = async () => {
    if (!selectedFIR?.fir_id) return;
    if (!confirm("Close this FIR? This action cannot be undone.")) return;
    setClosing(true);
    try {
      await routes.closeFIR({ fir_id: String(selectedFIR.fir_id) });
      setActiveFIRs((prev) => prev.filter((f) => f.fir_id !== selectedFIR.fir_id));
      setClosedFIRs((prev) => [{ ...selectedFIR, status: "closed" }, ...prev]);
      setAllStationFIRs((prev) => prev.map((f) => (f.fir_id === selectedFIR.fir_id ? { ...f, status: "closed" } : f)));
      setShowDetails(false);
    } catch (err) {
      alert(err?.detail || err?.message || "Failed to close FIR");
    } finally {
      setClosing(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>👮 Station Members</h2>
        <div className="member-list">
          {members?.length ? (
            members.map((m, i) => (
              <div key={`${m.name}-${i}`} className="member-card" title={m.name}>
                {m.name}
              </div>
            ))
          ) : (
            <p>No members found.</p>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="dashboard-content">
        {/* Top bar (kept compact by CSS) */}
        <header className="navbar">
          <div className="nav-left">
            <h1>Digital Police Station Dashboard</h1>
          </div>
          <div className="nav-right" ref={dropdownRef}>
            {user ? (
              <>
                <span className="nav-username" title={user.name}>
                  {user.name}
                </span>
                <div
                  className="profile-icon profile-elevated"
                  onClick={() => setDropdownOpen((s) => !s)}
                  role="button"
                  aria-label="Profile menu"
                >
                  {initials}
                </div>

                {dropdownOpen && (
                  <div className="dropdown-menu pretty">
                    <div className="dropdown-header">
                      <div className="avatar">{initials}</div>
                      <div className="meta">
                        <div className="officer-name" title={user.name}>
                          {user.name}
                        </div>
                        <div className="status-badge">On Duty</div>
                      </div>
                    </div>
                    <div className="dropdown-section">
                      <div className="kv">
                        <span className="k">Member ID</span>
                        <span className="v">{user.member_id ?? "—"}</span>
                      </div>
                      <div className="kv">
                        <span className="k">Station ID</span>
                        <span className="v">{user.station_id ?? "—"}</span>
                      </div>
                    </div>
                    <button className="dropdown-item logout-strong" onClick={logout}>
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <span className="loading-text">Loading profile…</span>
            )}
          </div>
        </header>

        {/* Toolbar */}
        <div style={toolbarRow}>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="file-btn" style={{ minWidth: 110 }} onClick={() => setSearchOpen((v) => !v)}>
              Search
            </button>
          </div>
          <button
            className="file-btn"
            onClick={() => {
              setShowFileModal(true);
              setCurrentStep(0);
            }}
          >
            + File FIR
          </button>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div ref={searchWrapRef} style={searchPanel}>
            <form className="search-wrap" onSubmit={submitSearch} style={{ width: "100%" }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search all FIRs (name, offence, location)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="search-btn" type="submit" disabled={searching}>
                {searching ? "Searching…" : "Go"}
              </button>
            </form>
            {!!searchQuery && (
              <div style={{ marginTop: 10 }}>
                <section style={cardStyle}>
                  <div style={cardHeader}>
                    <div style={cardTitle}>Search Results</div>
                    {searching && <span className="loading-text">Loading…</span>}
                  </div>
                  {(!searchResults || searchResults.length === 0) ? (
                    <p style={{ color: "#666", margin: 0 }}>No results.</p>
                  ) : (
                    <ul style={listStyle}>
                      {searchResults.map((f) => (
                        <li
                          key={`search-${f.fir_id}`}
                          style={listItem}
                          onClick={() => {
                            setSearchOpen(false);
                            openFIRDetails(f);
                          }}
                          title={`FIR #${f.fir_id}`}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {f.offence_type} — {f.fullname}
                          </div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            #{f.fir_id} • {f.incident_location || "—"} • {String(f.status || "active").toUpperCase()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {/* Station lists */}
        {!searchOpen && (
          <main style={{ padding: "0 24px 24px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <section style={cardStyle}>
                <div style={cardHeader}>
                  <div style={cardTitle}>Active FIRs</div>
                  {loadingFIRs && <span className="loading-text">Loading…</span>}
                </div>
                {activeFIRs.length === 0 && !loadingFIRs ? (
                  <p style={{ color: "#666", margin: 0 }}>No active FIRs.</p>
                ) : (
                  <ul style={listStyle}>
                    {activeFIRs.map((f) => (
                      <li key={`active-${f.fir_id}`} style={listItem} onClick={() => openFIRDetails(f)} title={`FIR #${f.fir_id}`}>
                        <div style={{ fontWeight: 700 }}>{f.offence_type ? `${f.offence_type} — ${f.fullname}` : `FIR #${f.fir_id}`}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>#{f.fir_id} • {f.incident_location || "—"}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={cardStyle}>
                <div style={cardHeader}>
                  <div style={cardTitle}>Closed FIRs</div>
                  {loadingFIRs && <span className="loading-text">Loading…</span>}
                </div>
                {closedFIRs.length === 0 && !loadingFIRs ? (
                  <p style={{ color: "#666", margin: 0 }}>No closed FIRs.</p>
                ) : (
                  <ul style={listStyle}>
                    {closedFIRs.map((f) => (
                      <li key={`closed-${f.fir_id}`} style={{ ...listItem, opacity: 0.85 }} onClick={() => openFIRDetails(f)} title={`FIR #${f.fir_id}`}>
                        <div style={{ fontWeight: 700 }}>{f.offence_type ? `${f.offence_type} — ${f.fullname}` : `FIR #${f.fir_id}`}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>#{f.fir_id} • {f.incident_location || "—"}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section style={{ ...cardStyle, marginTop: 20 }}>
              <div style={cardHeader}>
                <div style={cardTitle}>All FIRs (This Station)</div>
                {loadingFIRs && <span className="loading-text">Loading…</span>}
              </div>
              {allStationFIRs.length === 0 && !loadingFIRs ? (
                <p style={{ color: "#666", margin: 0 }}>No FIRs for this station.</p>
              ) : (
                <ul style={listStyle}>
                  {allStationFIRs.map((f) => (
                    <li key={`all-${f.fir_id}`} style={listItem} onClick={() => openFIRDetails(f)} title={`FIR #${f.fir_id}`}>
                      <div style={{ fontWeight: 700 }}>{f.offence_type ? `${f.offence_type} — ${f.fullname}` : `FIR #${f.fir_id}`}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        #{f.fir_id} • {f.incident_location || "—"} • {String(f.status || "active").toUpperCase()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </main>
        )}
      </div>

      {/* ====== File FIR Modal ====== */}
      {showFileModal && (
        <div className="modal-backdrop" onClick={() => setShowFileModal(false)}>
          <div className="modal-card pop wide" style={{ maxHeight: "86vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">File New FIR</div>

            <div className="stepper">
              {["Complainant", "Incident", "Narrative"].map((label, idx) => (
                <div key={label} className={`step ${currentStep === idx ? "active" : idx < currentStep ? "done" : ""}`}>
                  <div className="dot">{idx + 1}</div>
                  <div className="label">{label}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleFileFIR}>
              {currentStep === 0 && (
                <div className="grid2">
                  <div>
                    <label>Full Name</label>
                    <input className="modal-input" value={fileForm.fullname} onChange={(e) => setFileForm((p) => ({ ...p, fullname: e.target.value }))} />
                  </div>
                  <div>
                    <label>Age</label>
                    <input className="modal-input" type="number" min="0" value={fileForm.age} onChange={(e) => setFileForm((p) => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div>
                    <label>Gender</label>
                    <select className="modal-input" value={fileForm.gender} onChange={(e) => setFileForm((p) => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <input className="modal-input" value={fileForm.contact_number} onChange={(e) => setFileForm((p) => ({ ...p, contact_number: e.target.value }))} />
                  </div>
                  <div className="grid-span-2">
                    <label>Address</label>
                    <input className="modal-input" value={fileForm.address} onChange={(e) => setFileForm((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div>
                    <label>ID Proof Type</label>
                    <select className="modal-input" value={fileForm.id_proof_type} onChange={(e) => setFileForm((p) => ({ ...p, id_proof_type: e.target.value }))}>
                      <option value="">Select</option>
                      <option>Aadhar</option>
                      <option>PAN</option>
                      <option>Voter ID</option>
                      <option>Driving License</option>
                      <option>Passport</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label>ID Proof Value (optional)</label>
                    <input className="modal-input" value={fileForm.id_proof_value} onChange={(e) => setFileForm((p) => ({ ...p, id_proof_value: e.target.value }))} />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid2">
                  <div>
                    <label>Incident Date</label>
                    <input className="modal-input" type="date" value={fileForm.incident_date} onChange={(e) => setFileForm((p) => ({ ...p, incident_date: e.target.value }))} />
                  </div>
                  <div>
                    <label>Incident Time</label>
                    <input className="modal-input" type="time" value={fileForm.incident_time} onChange={(e) => setFileForm((p) => ({ ...p, incident_time: e.target.value }))} />
                  </div>
                  <div>
                    <label>Offence Type</label>
                    <input className="modal-input" value={fileForm.offence_type} onChange={(e) => setFileForm((p) => ({ ...p, offence_type: e.target.value }))} />
                  </div>
                  <div>
                    <label>Incident Location</label>
                    <input className="modal-input" value={fileForm.incident_location} onChange={(e) => setFileForm((p) => ({ ...p, incident_location: e.target.value }))} />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <>
                  <label>Case Narrative</label>
                  <textarea className="modal-input" rows={5} value={fileForm.case_narrative} onChange={(e) => setFileForm((p) => ({ ...p, case_narrative: e.target.value }))} />

                  <div className="review">
                    <div className="review-title">Quick Review</div>
                    <div className="review-grid">
                      <div><strong>Name:</strong> {fileForm.fullname || "—"}</div>
                      <div><strong>Age:</strong> {fileForm.age || "—"}</div>
                      <div><strong>Gender:</strong> {fileForm.gender || "—"}</div>
                      <div><strong>Contact:</strong> {fileForm.contact_number || "—"}</div>
                      <div className="grid-span-2"><strong>Address:</strong> {fileForm.address || "—"}</div>
                      <div><strong>ID Type:</strong> {fileForm.id_proof_type || "—"}</div>
                      <div><strong>ID Value:</strong> {fileForm.id_proof_value || "—"}</div>
                      <div><strong>Date:</strong> {fileForm.incident_date || "—"}</div>
                      <div><strong>Time:</strong> {fileForm.incident_time || "—"}</div>
                      <div><strong>Offence:</strong> {fileForm.offence_type || "—"}</div>
                      <div><strong>Location:</strong> {fileForm.incident_location || "—"}</div>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowFileModal(false)}>
                  Cancel
                </button>
                {currentStep > 0 && (
                  <button type="button" className="btn-secondary" onClick={handleBack}>
                    Back
                  </button>
                )}
                {currentStep < 2 ? (
                  <button type="button" className="btn-primary" onClick={handleNext}>
                    Next
                  </button>
                ) : (
                  <button type="submit" className="btn-primary" disabled={filing}>
                    {filing ? "Filing…" : "Submit FIR"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== FIR Details (read-only base + rich progress) ====== */}
      {showDetails && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)}>
          <div className="modal-card wide" style={{ maxHeight: "86vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">FIR Details</div>

            {!firDetails && detailsLoading && <div className="loading-text">Loading details…</div>}

            {firDetails && (
              <>
                {/* Read-only base info */}
                <div className="review" style={{ marginTop: 4 }}>
                  <div className="review-title">Overview</div>
                  <div className="review-grid">
                    <div><strong>FIR ID:</strong> {firDetails.fir_id}</div>
                    <div><strong>Status:</strong> {String(firDetails.status || "active").toUpperCase()}</div>
                    <div><strong>Name:</strong> {firDetails.fullname}</div>
                    <div><strong>Age:</strong> {firDetails.age}</div>
                    <div><strong>Gender:</strong> {firDetails.gender}</div>
                    <div><strong>Contact:</strong> {firDetails.contact_number}</div>
                    <div className="grid-span-2"><strong>Address:</strong> {firDetails.address}</div>
                    <div><strong>ID Type:</strong> {firDetails.id_proof_type}</div>
                    <div><strong>ID Value:</strong> {firDetails.id_proof_value || "—"}</div>
                    <div><strong>Date:</strong> {firDetails.incident_date}</div>
                    <div><strong>Time:</strong> {firDetails.incident_time}</div>
                    <div><strong>Offence:</strong> {firDetails.offence_type}</div>
                    <div><strong>Location:</strong> {firDetails.incident_location}</div>
                    <div className="grid-span-2"><strong>Narrative:</strong> {firDetails.case_narrative}</div>
                  </div>
                </div>

                {/* Existing progress list */}
                <div className="fir-section" style={{ marginTop: 12 }}>
                  <div className="section-title">Progress & Evidence</div>
                  {(!firDetails.progress || firDetails.progress.length === 0) ? (
                    <div style={{ color: "#777" }}>No updates yet.</div>
                  ) : (
                    <ul className="progress-list" style={{ marginTop: 6 }}>
                      {firDetails.progress.map((p, idx) => (
                        <li key={idx}>
                          {p.progress_text && <div><strong>Update:</strong> {p.progress_text}</div>}
                          {p.evidence_text && <div><strong>Evidence:</strong> {p.evidence_text}</div>}
                          {p.evidence_photos && <div><strong>Photos:</strong> {p.evidence_photos}</div>}
                          {p.witness_info && <div><strong>Witness:</strong> {p.witness_info}</div>}
                          {p.other_info && <div><strong>Other:</strong> {p.other_info}</div>}
                          {p.created_at && <div style={{ fontSize: 12, color: "#666" }}>{p.created_at}</div>}
                          <hr style={{ border: "none", borderTop: "1px dashed #e5e7ef", margin: "8px 0" }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Culprits list (if any) */}
                {Array.isArray(firDetails.culprits) && firDetails.culprits.length > 0 && (
                  <div className="fir-section" style={{ marginTop: 10 }}>
                    <div className="section-title">Culprit Records</div>
                    <ul className="progress-list" style={{ marginTop: 6 }}>
                      {firDetails.culprits.map((c, i) => (
                        <li key={i}>
                          <strong>{c.name || "Unknown"}</strong>
                          <div style={{ fontSize: 14 }}>
                            {(c.age || c.gender) && <> — {c.age ? `${c.age}y` : ""} {c.gender || ""}</>}
                          </div>
                          {c.address && <div><strong>Address:</strong> {c.address}</div>}
                          {c.identity_marks && <div><strong>Identity Marks:</strong> {c.identity_marks}</div>}
                          {c.custody_status && <div><strong>Custody:</strong> {c.custody_status}</div>}
                          {c.last_known_location && <div><strong>Last Known Location:</strong> {c.last_known_location}</div>}
                          {c.details && <div><strong>Details:</strong> {c.details}</div>}
                          <hr style={{ border: "none", borderTop: "1px dashed #e5e7ef", margin: "8px 0" }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Composer (only if not closed) */}
                {String(firDetails.status || "active").toLowerCase() !== "closed" && (
                  <div className="fir-section" style={{ marginTop: 12 }}>
                    <div className="section-title">Add Update</div>

                    <label>Progress Update (sentence)</label>
                    <textarea
                      className="modal-input"
                      rows={3}
                      value={progressForm.progress_text}
                      onChange={(e) => setProgressForm((p) => ({ ...p, progress_text: e.target.value }))}
                      placeholder="Describe progress made…"
                    />

                    <div className="grid2" style={{ marginTop: 8 }}>
                      <div>
                        <label>Evidence Notes</label>
                        <textarea
                          className="modal-input"
                          rows={3}
                          value={progressForm.evidence_text}
                          onChange={(e) => setProgressForm((p) => ({ ...p, evidence_text: e.target.value }))}
                          placeholder="What evidence was collected…"
                        />
                      </div>
                      <div>
                        <label>Evidence Photos (URLs, comma separated)</label>
                        <input
                          className="modal-input"
                          value={progressForm.evidence_photos}
                          onChange={(e) => setProgressForm((p) => ({ ...p, evidence_photos: e.target.value }))}
                          placeholder="https://… , https://…"
                        />
                      </div>
                      <div>
                        <label>Witness Information</label>
                        <textarea
                          className="modal-input"
                          rows={3}
                          value={progressForm.witness_info}
                          onChange={(e) => setProgressForm((p) => ({ ...p, witness_info: e.target.value }))}
                          placeholder="Name, statement summary…"
                        />
                      </div>
                      <div>
                        <label>Other Information</label>
                        <textarea
                          className="modal-input"
                          rows={3}
                          value={progressForm.other_info}
                          onChange={(e) => setProgressForm((p) => ({ ...p, other_info: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Culprit section toggle */}
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setProgressForm((p) => ({ ...p, culprit_open: !p.culprit_open }))}
                      >
                        {progressForm.culprit_open ? "Hide Culprit Fields" : "Add Culprit Details (optional)"}
                      </button>
                    </div>

                    {progressForm.culprit_open && (
                      <div className="review" style={{ marginTop: 10 }}>
                        <div className="review-title">Culprit Details</div>
                        <div className="grid2">
                          <div>
                            <label>Name</label>
                            <input
                              className="modal-input"
                              value={progressForm.culprit.name}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, name: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label>Age</label>
                            <input
                              className="modal-input"
                              type="number"
                              min="0"
                              value={progressForm.culprit.age}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, age: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label>Gender</label>
                            <input
                              className="modal-input"
                              value={progressForm.culprit.gender}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, gender: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label>Custody Status</label>
                            <input
                              className="modal-input"
                              placeholder="Jail / Bail / At Large"
                              value={progressForm.culprit.custody_status}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, custody_status: e.target.value } }))}
                            />
                          </div>
                          <div className="grid-span-2">
                            <label>Address</label>
                            <input
                              className="modal-input"
                              value={progressForm.culprit.address}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, address: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label>Identity Marks</label>
                            <input
                              className="modal-input"
                              value={progressForm.culprit.identity_marks}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, identity_marks: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label>Last Known Location</label>
                            <input
                              className="modal-input"
                              value={progressForm.culprit.last_known_location}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, last_known_location: e.target.value } }))}
                            />
                          </div>
                          <div className="grid-span-2">
                            <label>Additional Details</label>
                            <textarea
                              className="modal-input"
                              rows={3}
                              value={progressForm.culprit.details}
                              onChange={(e) => setProgressForm((p) => ({ ...p, culprit: { ...p.culprit, details: e.target.value } }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: 10 }}>
                      <button className="btn-secondary" onClick={() => setShowDetails(false)}>
                        Close
                      </button>
                      <button className="btn-primary" onClick={submitProgress} disabled={savingProgress}>
                        {savingProgress ? "Saving…" : "Save Update"}
                      </button>
                      <button className="btn-danger" onClick={closeSelectedFIR} disabled={closing}>
                        {closing ? "Closing…" : "Close FIR"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- inline styles for layout ---------- */
const toolbarRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 24px 8px",
};

const searchPanel = {
  padding: "0 24px 16px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  padding: 16,
  minHeight: 120,
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
 