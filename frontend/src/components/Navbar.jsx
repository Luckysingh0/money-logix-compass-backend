export function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="NiveshMitra home">
      {/* Swap this SVG for your real logo file: <img src="/logo.png" height="32" /> */}
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="currentColor" opacity=".16" />
        <path d="M7 25V9l8 11V9m4 16V9l8 16V9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      NiveshMitra
    </button>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

export default function Navbar({ theme, onToggleTheme, onStart }) {
  return (
    <header className="nav">
      <Logo />
      <div className="nav-right">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button className="btn btn-primary" onClick={onStart}>Get started</button>
      </div>
    </header>
  );
}
