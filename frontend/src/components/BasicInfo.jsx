import React, { useState } from "react";
import { api } from "../api/client.js";

const GOALS = [
  "Retirement",
  "Buy a house",
  "Child's education",
  "Wealth building",
  "Emergency fund",
  "Travel",
  "Start a business",
  "Other",
];

export default function BasicInfo({ theme, onToggleTheme, user, onDone }) {
  const [name, setName] = useState(
    user?.name && user.name !== "Friend" ? user.name : "",
  );
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please tell us your name.");
      return;
    }
    if (!goal) {
      setError("Pick your main goal so we can tailor things.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.saveBasicInfo(user.email, {
        name: name.trim(),
        age,
        city: city.trim(),
        occupation: occupation.trim(),
        phone: phone.trim(),
        monthlyIncome,
        goal,
      });
      onDone(res.user);
    } catch (err) {
      setError(err.message || "Could not save your details.");
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <button
        className="ghost icon-btn auth-theme"
        onClick={onToggleTheme}
        title={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <form className="auth-card info-card" onSubmit={submit}>
        <div className="brand auth-brand">
          <span className="logo">🪙</span>
          <h1>NiveshMitra</h1>
        </div>
        <h2 className="auth-title">A few quick details</h2>
        <p className="auth-sub">
          This helps NiveshMitra understand you before we chat. Takes 20 seconds
          — we'll learn the rest naturally in conversation.
        </p>

        <div className="info-grid">
          <label className="auth-label">
            Full name
            <input
              type="text"
              value={name}
              autoFocus
              placeholder="e.g. Aarav Sharma"
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </label>

          <label className="auth-label">
            Age
            <input
              type="number"
              min="10"
              max="100"
              value={age}
              placeholder="e.g. 28"
              required
              onChange={(e) => setAge(e.target.value)}
            />
          </label>

          <label className="auth-label">
            City
            <input
              type="text"
              value={city}
              placeholder="e.g. Pune"
              required
              onChange={(e) => setCity(e.target.value)}
            />
          </label>

          <label className="auth-label">
            Occupation
            <input
              type="text"
              value={occupation}
              placeholder="e.g. Software engineer"
              required
              onChange={(e) => setOccupation(e.target.value)}
            />
          </label>

          <label className="auth-label">
            Phone <span className="optional">(optional)</span>
            <input
              type="tel"
              value={phone}
              placeholder="e.g. 98765 43210"
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="auth-label">
            Monthly income (₹)
            <input
              type="number"
              min="0"
              value={monthlyIncome}
              placeholder="e.g. 60000"
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
          </label>

          <label className="auth-label info-full">
            Primary financial goal
            <select
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setError("");
              }}
            >
              <option value="">Select a goal…</option>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="cta-btn full" disabled={busy}>
          {busy ? "Saving…" : "Start chatting →"}
        </button>
      </form>
    </div>
  );
}
