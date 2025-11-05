import React from "react";
import { useNavigate } from "react-router-dom";

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <button className="logout-btn" onClick={logout}>Logout</button>
      <div>Welcome, Police Officer 🚔</div>
    </div>
  );
}
