import { ArrowRight, BriefcaseBusiness, ClipboardCheck, ReceiptText, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { extractErrorMessage, extractFieldErrors } from "../api/client";
import AlertBanner from "../components/AlertBanner";
import ThemeToggle from "../components/ThemeToggle";
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
    <div className="grid min-h-screen bg-mist lg:grid-cols-[1.08fr_0.92fr] dark:bg-[#0f0d15]">
      <section className="hidden border-r border-slate-200/70 bg-gradient-to-br from-white via-brand-50 to-accent-50 px-12 py-16 lg:flex lg:flex-col dark:border-slate-800 dark:from-[#15111b] dark:via-[#191421] dark:to-[#11161a]">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500">Expense Suite</p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight text-slate-950 dark:text-slate-50">
            Reimbursements, approvals, and reporting in one clean workspace.
          </h1>
          <p className="mt-5 max-w-lg text-base text-slate-600 dark:text-slate-300">
            Simple for employees, structured for managers, and ready for finance teams.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <FeatureTile icon={ReceiptText} title="Expenses" />
          <FeatureTile icon={ClipboardCheck} title="Approvals" />
          <FeatureTile icon={BriefcaseBusiness} title="Company setup" />
          <FeatureTile icon={ShieldCheck} title="Reports" />
        </div>

        <div className="mt-auto rounded-[1.7rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoPill label="Theme" value="Light or dark" />
            <InfoPill label="Receipts" value="OCR enabled" />
            <InfoPill label="Data" value="Real-time" />
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-[#17151f]/95">
          <div className="flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Secure access</p>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Sign in</h2>
            </div>
          </div>

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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="module-chip">Dashboard</span>
            <span className="module-chip">Expenses</span>
            <span className="module-chip">Approvals</span>
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
            Need a company workspace?{" "}
            <Link to="/signup" className="font-semibold text-brand-600">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureTile({ icon: Icon, title }) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-100">
        <Icon size={18} />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</p>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

export default LoginPage;
