import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import AlertBanner from "../components/AlertBanner";
import { extractErrorMessage, extractFieldErrors } from "../api/client";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBanner("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(form);
      const nextRoute = location.state?.from?.pathname || "/dashboard";
      navigate(nextRoute, { replace: true });
    } catch (error) {
      setBanner(extractErrorMessage(error));
      setFieldErrors(extractFieldErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-hero px-12 py-16 text-white lg:flex lg:flex-col">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-100">FlowMint</p>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Expense approvals that feel like a modern finance workspace.
          </h1>
          <p className="mt-6 text-lg text-white/80">
            Manage company setup, employee expenses, OCR receipts, and hybrid approval rules from one clean dashboard.
          </p>
        </div>

        <div className="mt-auto grid gap-4">
          <div className="glass-panel rounded-3xl border border-white/10 p-5 text-slate-900">
            <p className="text-sm font-semibold text-brand-700">Hackathon ready</p>
            <p className="mt-2 text-sm text-slate-600">
              Firestore-backed data, JWT auth, OCR upload, and responsive pages are already built into the flow.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Secure Access</p>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">Log in to review requests, submit expenses, and track reimbursements.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <AlertBanner type="error" message={banner} />

            <div>
              <label className="field-label" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="field-input"
                placeholder="you@company.com"
              />
              {fieldErrors.email ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.email}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="field-input"
                placeholder="Enter your password"
              />
              {fieldErrors.password ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.password}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Need a company workspace?{" "}
            <Link to="/signup" className="font-semibold text-brand-600">
              Create one here
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
