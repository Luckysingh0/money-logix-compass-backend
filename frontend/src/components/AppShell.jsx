import { useState } from "react";
import Chat from "./Chat";
import PlanDashboard from "./PlanDashboard";
import { Logo, ThemeToggle } from "./Navbar";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "plan", label: "My plan" },
];

export default function AppShell({ user, theme, onToggleTheme, onLogout }) {
  const [tab, setTab] = useState("chat");

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <Logo />
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <div className="sidebar-foot">
          <span className="user-line">{user?.email}</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      </nav>

      <main className="main">
        {tab === "chat" ? <Chat /> : <PlanDashboard />}
        <p className="disclaimer">Educational only. Not financial advice. No trades are placed and returns are never guaranteed.</p>
      </main>
    </div>
  );
}
