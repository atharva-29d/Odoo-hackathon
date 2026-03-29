import {
  Building2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users2,
  WalletCards,
  X
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { sentenceCase } from "../utils/formatters";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/submit-expense": "Submit Expense",
  "/my-expenses": "My Expenses",
  "/approvals": "Approvals",
  "/admin": "Admin Panel"
};

function AppLayout() {
  const { user, company, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
    { to: "/submit-expense", label: "Submit Expense", icon: FilePlus2, roles: ["admin", "manager", "employee"] },
    { to: "/my-expenses", label: "My Expenses", icon: WalletCards, roles: ["admin", "manager", "employee"] },
    { to: "/approvals", label: "Approvals", icon: ClipboardList, roles: ["admin", "manager"] },
    { to: "/admin", label: "Admin Panel", icon: Users2, roles: ["admin"] }
  ].filter((item) => item.roles.includes(user?.role));

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-slate-200/80 bg-white/95 px-5 py-6 text-slate-900 shadow-sidebar dark:border-slate-800 dark:bg-[#14111b]/95 dark:text-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/15 dark:text-brand-100">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-500">Expense Suite</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Reimbursement</h1>
          </div>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 p-2 text-slate-500 lg:hidden dark:border-slate-700 dark:text-slate-300"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-brand-100 bg-gradient-to-br from-white via-brand-50 to-accent-50 p-4 dark:border-brand-500/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Company</p>
        <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{company?.name || "Workspace"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="mini-label">{company?.baseCurrency || "USD"}</span>
          <span className="mini-label capitalize">{sentenceCase(company?.approvalRule || "hybrid")}</span>
        </div>
      </div>

      <nav className="mt-8 space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[1.2rem] px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-500/15 dark:text-brand-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                }`
              }
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white text-slate-500 shadow-sm transition group-hover:text-brand-600 dark:bg-slate-900 dark:text-slate-300">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-100">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-950 dark:text-slate-50">{user?.name}</p>
            <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="app-backdrop min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">{sidebar}</div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden">
          <div className="h-full w-[84%] max-w-[320px]">{sidebar}</div>
        </div>
      ) : null}

      <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/80 bg-white/80 px-4 py-4 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-[#17151f]/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-[1rem] border border-slate-200 bg-white p-3 text-slate-600 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-500">{company?.name || "Workspace"}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {PAGE_TITLES[location.pathname] || "Reimbursement"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="module-chip hidden sm:inline-flex">{company?.baseCurrency || "USD"}</span>
            <span className="module-chip hidden md:inline-flex capitalize">{sentenceCase(user?.role || "employee")}</span>
            <ThemeToggle compact />
          </div>
        </div>

        <div className="page-shell p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
