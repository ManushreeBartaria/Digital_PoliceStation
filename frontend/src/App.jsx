import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import PoliceDashboard from "./pages/PoliceDashboard";
import GovernmentDashboard from "./pages/GovernmentDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/citizen" element={<CitizenDashboard />} />
        <Route path="/police" element={<PoliceDashboard />} />
        <Route path="/government" element={<GovernmentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
