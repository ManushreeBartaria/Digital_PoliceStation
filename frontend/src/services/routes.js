// src/services/routes.js
// Centralized routes for all API calls using axios instance from api.js

import api from "./api";

/**
 * Helper: include Bearer token in headers if available
 */
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ---------------------- CITIZEN ROUTES ---------------------- */
export async function addCitizen(payload) {
  try {
    const res = await api.post("/citizen/addcitizen", payload);
    return res.data; // { message, citizen_id }
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function citizenAuth(payload) {
  try {
    const res = await api.post("/citizen/citizenAuth", payload);
    // Save token on successful login
    if (res.data?.access_token) {
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", "citizen");
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

/* ---------------------- POLICE ROUTES ---------------------- */
export async function addPoliceStation(payload) {
  try {
    const res = await api.post("/policeauth/policestationdetails", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function addPoliceMember(payload) {
  try {
    const res = await api.post("/policeauth/addpolicemember", payload, {
      headers: authHeaders(),
    });
    return res.data; // { message, member_id }
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function policeAuth(payload) {
  try {
    const res = await api.post("/policeauth/policeauth", payload);
    if (res.data?.access_token) {
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", "police");
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAllMembers() {
  try {
    const res = await api.get("/policeauth/allmembers", {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

/* ---------------------- FIR ROUTES ---------------------- */
export async function registerIncident(payload) {
  try {
    const res = await api.post("/fir/register_incident", payload, {
      headers: authHeaders(),
    });
    return res.data; // { message, report_id, registered_by_name }
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function addProgress(payload) {
  try {
    const res = await api.post("/fir/add_progress", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getProgress(payload) {
  try {
    const res = await api.post("/fir/get_progress", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function closeFIR(payload) {
  try {
    const res = await api.post("/fir/close_fir", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

/* ---------------------- GOVERNMENT ROUTES ---------------------- */
export async function addGovernment(payload) {
  try {
    const res = await api.post("/government/addgovernment", payload);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function governmentAuth(payload) {
  try {
    const res = await api.post("/government/governmentAuth", payload);
    if (res.data?.access_token) {
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", "government");
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function governmentSearchFIR(payload) {
  try {
    const res = await api.post("/government/governmentsearchfir", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function escalateFIR(payload) {
  try {
    const res = await api.post("/government/escalatefir", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

/* ---------------------- EXPORT ALL ROUTES ---------------------- */
const routes = {
  // Citizen
  addCitizen,
  citizenAuth,
  // Police
  addPoliceStation,
  addPoliceMember,
  policeAuth,
  getAllMembers,
  // FIR
  registerIncident,
  addProgress,
  getProgress,
  closeFIR,
  // Government
  addGovernment,
  governmentAuth,
  governmentSearchFIR,
  escalateFIR,
};

export default routes;
