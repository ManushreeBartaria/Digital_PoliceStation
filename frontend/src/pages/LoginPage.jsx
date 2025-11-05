import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import routes from "../services/routes";

export default function LoginPage() {
  const [role, setRole] = useState("citizen"); // citizen | police | government
  const [mode, setMode] = useState("login"); // login | register
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const resetForm = () => setForm({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (role === "citizen") {
      if (!form.aadhar_no || !form.password)
        return "Aadhar and password are required.";
    } else if (role === "police") {
      if (mode === "register") {
        if (!form.name || !form.password || !form.station_id)
          return "Name, password, and station ID are required.";
      } else {
        if (!form.station_id || !form.member_id || !form.password)
          return "Station ID, Member ID, and password are required.";
      }
    } else if (role === "government") {
      if (!form.government_member_id || !form.password)
        return "Government Member ID and password are required.";
    }
    return null;
  };

  const extractErrorMessage = (error) => {
    const resp = error?.response?.data || error;
    if (!resp) return String(error);
    if (typeof resp === "string") return resp;
    if (resp.detail)
      return Array.isArray(resp.detail)
        ? JSON.stringify(resp.detail, null, 2)
        : resp.detail;
    if (resp.message) return resp.message;
    return JSON.stringify(resp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      if (mode === "register") {
        // -------- CITIZEN REGISTER --------
        if (role === "citizen") {
          await routes.addCitizen({
            aadhar_no: form.aadhar_no,
            password: form.password,
          });
          await routes.citizenAuth({
            aadhar_no: form.aadhar_no,
            password: form.password,
          });
          navigate("/citizen");
        }

        // -------- POLICE REGISTER --------
        else if (role === "police") {
          const created = await routes.addPoliceMember({
            name: form.name,
            password: form.password,
            station_id: Number(form.station_id),
          });
          const memberId = created?.member_id || Number(form.member_id || 0);
          const auth = await routes.policeAuth({
            station_id: Number(form.station_id),
            member_id: memberId,
            password: form.password,
          });

          // Store officer details directly from backend
          if (auth?.access_token) {
            localStorage.setItem("token", auth.access_token);
            localStorage.setItem("role", "police");
            localStorage.setItem(
              "user",
              JSON.stringify({
                name: auth.member_name,
                station_id: auth.station_id,
                member_id: auth.member_id,
              })
            );
          }

          navigate("/police");
        }

        // -------- GOVERNMENT REGISTER --------
        else if (role === "government") {
          const created = await routes.addGovernment({
            government_member_id: Number(form.government_member_id),
            password: form.password,
          });

          if (created?.access_token) {
            localStorage.setItem("token", created.access_token);
            localStorage.setItem("role", "government");
            navigate("/government");
          } else if (created?.government_id) {
            await routes.governmentAuth({
              government_member_id: Number(form.government_member_id),
              password: form.password,
            });
            navigate("/government");
          } else {
            alert(
              "Government account created successfully, but no token returned. Contact admin for verification."
            );
            navigate("/");
          }
        }
      } else {
        // -------- LOGIN MODE --------
        if (role === "citizen") {
          await routes.citizenAuth({
            aadhar_no: form.aadhar_no,
            password: form.password,
          });
          navigate("/citizen");
        } else if (role === "police") {
          const auth = await routes.policeAuth({
            station_id: Number(form.station_id),
            member_id: Number(form.member_id),
            password: form.password,
          });

          // Store officer details from backend
          if (auth?.access_token) {
            localStorage.setItem("token", auth.access_token);
            localStorage.setItem("role", "police");
            localStorage.setItem(
              "user",
              JSON.stringify({
                name: auth.member_name,
                station_id: auth.station_id,
                member_id: auth.member_id,
              })
            );
          }

          navigate("/police");
        } else if (role === "government") {
          const auth = await routes.governmentAuth({
            government_member_id: Number(form.government_member_id),
            password: form.password,
          });
          if (auth?.access_token) {
            localStorage.setItem("token", auth.access_token);
            localStorage.setItem("role", "government");
            navigate("/government");
          } else {
            alert("Invalid government credentials.");
          }
        }
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      alert("Error: " + message);
      console.error("Login/Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#f4f6f8",
      }}
    >
      <form
        className="login-box"
        onSubmit={handleSubmit}
        style={{
          width: 420,
          maxWidth: "95%",
          background: "#fff",
          padding: 24,
          borderRadius: 10,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#1f3a93",
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          Digital Police Station
        </h1>

        {/* Role Selector */}
        <label style={{ fontWeight: 600 }}>Role</label>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            resetForm();
            setMode("login");
          }}
          style={{
            ...inputStyle,
            marginBottom: 12,
          }}
        >
          <option value="citizen">Citizen</option>
          <option value="police">Police</option>
          <option value="government">Government</option>
        </select>

        {/* Toggle Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 6,
              border: "none",
              backgroundColor: mode === "login" ? "#1f3a93" : "#f0f0f0",
              color: mode === "login" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 6,
              border: "none",
              backgroundColor: mode === "register" ? "#1f3a93" : "#f0f0f0",
              color: mode === "register" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>

        {/* Form Fields */}
        {role === "citizen" && (
          <>
            <label>Aadhar Number</label>
            <input
              name="aadhar_no"
              value={form.aadhar_no || ""}
              onChange={handleChange}
              placeholder="Aadhar Number"
              style={inputStyle}
            />
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Password"
              style={inputStyle}
            />
          </>
        )}

        {role === "police" && (
          <>
            {mode === "register" ? (
              <>
                <label>Officer Name</label>
                <input
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  placeholder="Full Name"
                  style={inputStyle}
                />
                <label>Station ID</label>
                <input
                  name="station_id"
                  value={form.station_id || ""}
                  onChange={handleChange}
                  placeholder="Station ID"
                  style={inputStyle}
                />
              </>
            ) : (
              <>
                <label>Station ID</label>
                <input
                  name="station_id"
                  value={form.station_id || ""}
                  onChange={handleChange}
                  placeholder="Station ID"
                  style={inputStyle}
                />
                <label>Member ID</label>
                <input
                  name="member_id"
                  value={form.member_id || ""}
                  onChange={handleChange}
                  placeholder="Member ID"
                  style={inputStyle}
                />
              </>
            )}
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Password"
              style={inputStyle}
            />
          </>
        )}

        {role === "government" && (
          <>
            <label>Government Member ID</label>
            <input
              name="government_member_id"
              value={form.government_member_id || ""}
              onChange={handleChange}
              placeholder="Government Member ID"
              style={inputStyle}
            />
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Password"
              style={inputStyle}
            />
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "#1f3a93",
            color: "#fff",
            cursor: "pointer",
            opacity: loading ? 0.85 : 1,
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login"
            : "Register & Login"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ddd",
  marginBottom: 10,
};
