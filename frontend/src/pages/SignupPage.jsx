import { Building2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import AlertBanner from "../components/AlertBanner";
import { extractErrorMessage, extractFieldErrors } from "../api/client";
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
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">New Workspace</p>
              <h2 className="text-2xl font-bold text-slate-900">Set up your company</h2>
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
                <option value="hybrid">Hybrid rule</option>
                <option value="percentage">60% threshold</option>
                <option value="specific">CFO based</option>
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
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating workspace..." : "Create workspace"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden bg-hero px-12 py-16 text-white lg:flex lg:flex-col">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-100">Launch Faster</p>
          <h1 className="mt-6 text-5xl font-bold leading-tight">Spin up approvals, finance oversight, and employee claims in minutes.</h1>
          <p className="mt-6 text-lg text-white/80">
            Signup automatically creates your company, sets the default currency from country, and provisions the first admin.
          </p>
        </div>

        <div className="mt-auto rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <Sparkles size={20} />
            <p className="font-semibold">Built for local demos</p>
          </div>
          <p className="mt-3 text-sm text-white/80">
            Firestore persists every request, OCR runs locally through Tesseract, and the UI is fully responsive for judge demos on laptop or mobile.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SignupPage;
