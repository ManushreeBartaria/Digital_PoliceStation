// src/services/routes.js
import api from "./api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ====================== CITIZEN ====================== */
export async function addCitizen(payload) {
  const res = await api.post("/citizen/addcitizen", payload);
  return res.data;
}

export async function citizenAuth(payload) {
  const res = await api.post("/citizen/citizenAuth", payload);
  const data = res.data;

  if (data?.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", "citizen");
  }

  if (data?.citizen_id || data?.aadhar_no) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "Citizen",
        citizen_id: data.citizen_id ?? null,
        aadhar_no: data.aadhar_no ?? "",
      })
    );
  }
  return data;
}

/* ====================== POLICE ====================== */
export async function addPoliceMember(payload) {
  const res = await api.post("/policeauth/addpolicemember", payload);
  return res.data;
}

export async function policeAuth(payload) {
  const res = await api.post("/policeauth/policeauth", payload);
  const data = res.data;

  if (data?.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", "police");
  }
  if (data?.name || data?.station_id || data?.police_member_id) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: data.name || "Officer",
        station_id: data.station_id,
        member_id: data.police_member_id,
      })
    );
  }
  return data;
}

export async function getAllMembers() {
  const res = await api.get("/policeauth/allmembers", { headers: authHeaders() });
  return res.data;
}

/* ======================== FIR ======================== */
export async function registerIncident(payload) {
  const res = await api.post("/fir/register_incident", payload, { headers: authHeaders() });
  return res.data;
}

export async function addProgress(payload) {
  const res = await api.post("/fir/add_progress", payload, { headers: authHeaders() });
  return res.data; // { progress: [...] }
}

export async function getProgress(payload) {
  const res = await api.post("/fir/get_progress", payload, { headers: authHeaders() });
  return res.data; // { progress: [...] }
}

export async function getFIRDetails(fir_id) {
  const res = await api.get(`/fir/details`, {
    params: { fir_id },
    headers: authHeaders(),
  });
  return res.data; // FIRDetailsResponse
}

export async function closeFIR(payload) {
  const res = await api.post("/fir/close_fir", payload, { headers: authHeaders() });
  return res.data;
}

export async function getFIRsByStation() {
  const res = await api.get("/fir/list_by_station", { headers: authHeaders() });
  return res.data; // { active:[], closed:[], all:[] }
}

export async function getAllFIRs() {
  const res = await api.get("/fir/list", { headers: authHeaders() });
  return res.data; // array
}

export async function searchFIRs(query) {
  const res = await api.get(`/fir/search`, {
    params: { q: query },
    headers: authHeaders(),
  });
  return res.data; // array
}

export async function getCitizenFIRs() {
  const res = await api.get("/fir/list_by_aadhar", { headers: authHeaders() });
  return res.data;
}

export async function getFIRDetail(fir_id) {
  const res = await api.get(`/fir/detail/${encodeURIComponent(fir_id)}`, {
    headers: authHeaders(),
  });
  return res.data; // full FIR + latest progress
}

/* ====================== CITIZEN ESCALATION ====================== */
// lives under /citizen per your citizen router
export async function escalateFIR(payload) {
  const res = await api.post("/citizen/escalatefir", payload, { headers: authHeaders() });
  return res.data; // { fir_id, aadhar_no, reason }
}

/* ====================== GOVERNMENT ====================== */
export async function addGovernment(payload) {
  const res = await api.post("/government/addgovernment", payload);
  return res.data;
}

export async function governmentAuth(payload) {
  const res = await api.post("/government/governmentAuth", payload);
  const data = res.data;
  if (data?.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", "government");
  }
  return data;
}

export async function governmentSearchFIR(payload) {
  const res = await api.post("/government/governmentsearchfir", payload, {
    headers: authHeaders(),
  });
  return res.data;
}

const routes = {
  // Citizen
  addCitizen,
  citizenAuth,

  // Police
  addPoliceMember,
  policeAuth,
  getAllMembers,

  // FIR
  registerIncident,
  addProgress,
  getProgress,
  getFIRDetails,
  closeFIR,
  getFIRsByStation,
  getAllFIRs,
  searchFIRs,
  getCitizenFIRs,
  getFIRDetail,

  // Escalation (citizen)
  escalateFIR,

  // Government
  addGovernment,
  governmentAuth,
  governmentSearchFIR,
};

export default routes;
