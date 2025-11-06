// src/services/routes.js
import api from "./api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ====================== CITIZEN ====================== */
/* ====================== CITIZEN ====================== */
export async function addCitizen(payload) {
  try {
    const res = await api.post("/citizen/addcitizen", payload);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function citizenAuth(payload) {
  try {
    const res = await api.post("/citizen/citizenAuth", payload);
    const data = res.data;

    if (data?.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", "citizen");
    }

    // Save a minimal user profile for citizen
    // (so the dashboard header and forms can read it)
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
  } catch (err) {
    throw err.response?.data || err;
  }
}


/* ====================== POLICE ====================== */
export async function addPoliceMember(payload) {
  try {
    const res = await api.post("/policeauth/addpolicemember", payload);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function policeAuth(payload) {
  try {
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
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAllMembers() {
  try {
    const res = await api.get("/policeauth/allmembers", { headers: authHeaders() });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

/* ======================== FIR ======================== */
// Create FIR
export async function registerIncident(payload) {
  try {
    const res = await api.post("/fir/register_incident", payload, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Add rich progress (all fields optional)
// payload shape:
// {
//   fir_id: string,
//   progress_text?: string,
//   evidence_text?: string,
//   evidence_photos?: string, // comma-separated URLs/paths if you use it
//   witness_info?: string,
//   other_info?: string,
//   culprit?: {
//     name: string,
//     age?: number, gender?: string, address?: string,
//     identity_marks?: string, custody_status?: string,
//     details?: string, last_known_location?: string
//   }
// }
export async function addProgress(payload) {
  try {
    const res = await api.post("/fir/add_progress", payload, {
      headers: authHeaders(),
    });
    return res.data; // { progress: [...] }
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Get all progress records for a FIR
export async function getProgress(payload) {
  try {
    const res = await api.post("/fir/get_progress", payload, {
      headers: authHeaders(),
    });
    return res.data; // { progress: [...] }
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Get full FIR (core info + progress + culprits)
export async function getFIRDetails(fir_id) {
  try {
    const res = await api.get(`/fir/details`, {
      params: { fir_id },
      headers: authHeaders(),
    });
    return res.data; // FIRDetailsResponse
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Close FIR
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

// Station-scoped lists (active/closed/all)
export async function getFIRsByStation() {
  try {
    const res = await api.get("/fir/list_by_station", { headers: authHeaders() });
    return res.data; // { active:[], closed:[], all:[] }
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Global list
export async function getAllFIRs() {
  try {
    const res = await api.get("/fir/list", { headers: authHeaders() });
    return res.data; // array
  } catch (err) {
    throw err.response?.data || err;
  }
}

// Global search
export async function searchFIRs(query) {
  try {
    const res = await api.get(`/fir/search`, {
      params: { q: query },
      headers: authHeaders(),
    });
    return res.data; // array
  } catch (err) {
    throw err.response?.data || err;
  }
}

// --- add near your FIR routes ---
export async function getCitizenFIRs() {
  try {
    const res = await api.get("/fir/list_by_aadhar", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data; // [{ fir_id, fullname, offence_type, incident_location, status, incident_date }]
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getFIRDetail(fir_id) {
  try {
    const res = await api.get(`/fir/detail/${encodeURIComponent(fir_id)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data; // full FIR + latest progress
  } catch (err) {
    throw err.response?.data || err;
  }
}


/* ====================== GOVERNMENT ====================== */
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
    const data = res.data;
    if (data?.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", "government");
    }
    return data;
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

/* ====================== EXPORT ====================== */
const routes = {

 
  getCitizenFIRs,
  getFIRDetail,
  escalateFIR, 


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

  // Government
  addGovernment,
  governmentAuth,
  governmentSearchFIR,
  escalateFIR,
};

export default routes;
