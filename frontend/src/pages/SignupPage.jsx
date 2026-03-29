import { ArrowRight, Building2, ClipboardCheck, ReceiptText, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { extractErrorMessage, extractFieldErrors } from "../api/client";
import AlertBanner from "../components/AlertBanner";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    country: "",
    adminName: "",
    email: "",
    password: "",
    approvalRule: "hybrid"
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
      await signup(form);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setBanner(extractErrorMessage(error));
      setFieldErrors(extractFieldErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-mist lg:grid-cols-[0.94fr_1.06fr] dark:bg-[#0f0d15]">
      <section className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-[#17151f]/95">
          <div className="flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-100">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Company setup</p>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Create workspace</h2>
            </div>
          </div>

          <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <AlertBanner type="error" message={banner} />
            </div>

            <div className="md:col-span-2">
              <label className="field-label" htmlFor="companyName">
                Company name
              </label>
              <input id="companyName" name="companyName" required value={form.companyName} onChange={handleChange} className="field-input" placeholder="Acme Logistics" />
              {fieldErrors.companyName ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.companyName}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="country">
                Country
              </label>
              <input id="country" name="country" required value={form.country} onChange={handleChange} className="field-input" placeholder="India" />
              {fieldErrors.country ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.country}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="approvalRule">
                Approval rule
              </label>
              <select id="approvalRule" name="approvalRule" value={form.approvalRule} onChange={handleChange} className="field-input">
                <option value="hybrid">Hybrid</option>
                <option value="percentage">60% threshold</option>
                <option value="specific">CFO approval</option>
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="adminName">
                Admin name
              </label>
              <input id="adminName" name="adminName" required value={form.adminName} onChange={handleChange} className="field-input" placeholder="Aarav Shah" />
              {fieldErrors.adminName ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.adminName}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Admin email
              </label>
              <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="field-input" placeholder="admin@company.com" />
              {fieldErrors.email ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.email}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input id="password" name="password" type="password" minLength="6" required value={form.password} onChange={handleChange} className="field-input" placeholder="At least 6 characters" />
              {fieldErrors.password ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.password}</p> : null}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating workspace..." : "Create workspace"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="module-chip">Company</span>
            <span className="module-chip">Admin</span>
            <span className="module-chip">Currency</span>
            <span className="module-chip">Workflow</span>
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden border-l border-slate-200/70 bg-gradient-to-br from-white via-brand-50 to-accent-50 px-12 py-16 lg:flex lg:flex-col dark:border-slate-800 dark:from-[#15111b] dark:via-[#191421] dark:to-[#11161a]">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-100">Expense Suite</p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight text-slate-950 dark:text-slate-50">
            Set up a professional reimbursement workspace in minutes.
          </h1>
          <p className="mt-5 max-w-lg text-base text-slate-600 dark:text-slate-300">
            The company, admin user, currency, and approval logic are created together.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <SetupTile icon={Building2} title="Company" />
          <SetupTile icon={ClipboardCheck} title="Approval flow" />
          <SetupTile icon={ReceiptText} title="Expense capture" />
        </div>

        <div className="mt-auto rounded-[1.7rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <Sparkles className="text-brand-500" size={18} />
            <p className="font-semibold text-slate-950 dark:text-slate-50">What you get</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoPill label="Default currency" value="From country" />
            <InfoPill label="First user" value="Admin account" />
            <InfoPill label="Rule engine" value="Ready to use" />
            <InfoPill label="Receipts" value="OCR support" />
          </div>
        </div>
      </section>
    </div>
  );
}

function SetupTile({ icon: Icon, title }) {
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

export default SignupPage;
