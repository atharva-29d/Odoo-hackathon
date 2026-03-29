import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users2,
  WalletCards,
  X
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../hooks/useAuth";

function AppLayout() {
  const { user, company, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
    { to: "/submit-expense", label: "Submit Expense", icon: FilePlus2, roles: ["admin", "manager", "employee"] },
    { to: "/my-expenses", label: "My Expenses", icon: WalletCards, roles: ["admin", "manager", "employee"] },
    { to: "/approvals", label: "Approvals", icon: ClipboardList, roles: ["admin", "manager"] },
    { to: "/users", label: "Users", icon: Users2, roles: ["admin", "manager"] }
  ].filter((item) => item.roles.includes(user?.role));

  const sidebar = (
    <aside className="flex h-full flex-col rounded-r-[2rem] bg-slate-950 px-5 py-6 text-white shadow-sidebar">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">FlowMint</p>
          <h1 className="mt-2 text-2xl font-bold">Reimburse</h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/10 p-2 text-slate-300 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Company</p>
        <p className="mt-2 text-lg font-semibold">{company?.name || "Workspace"}</p>
        <p className="mt-1 text-sm text-slate-400">
          Base currency {company?.baseCurrency || "USD"} . {company?.approvalRule || "hybrid"} approvals
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">{sidebar}</div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden">
          <div className="h-full w-[86%] max-w-[320px]">{sidebar}</div>
        </div>
      ) : null}

      <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:px-10 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-500">FlowMint</p>
            <h1 className="text-xl font-bold text-slate-900">{company?.name || "Reimburse"}</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-soft backdrop-blur-xl sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
