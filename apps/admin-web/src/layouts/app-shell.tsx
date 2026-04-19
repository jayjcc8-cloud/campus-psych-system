import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/appointments", label: "Appointments" },
  { to: "/risks", label: "Risks" },
  { to: "/config", label: "Config" }
];

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="eyebrow">Campus Psych</p>
        <h1>Operations Console</h1>
        <p className="sidebar-copy">
          A scaffolded counselor and admin workspace aligned with the MVP PRD.
        </p>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

