import { ArrowRightLeft, ImageUp, LoaderCircle, Receipt, ScanSearch, WandSparkles } from "lucide-react";
import { useState } from "react";

import { api, extractErrorMessage, extractFieldErrors, serverBaseUrl } from "../api/client";
import AlertBanner from "../components/AlertBanner";
import DownloadReportButton from "../components/DownloadReportButton";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { currencyOptions, expenseCategories } from "../utils/constants";

function SubmitExpensePage() {
  const { company } = useAuth();
  const [form, setForm] = useState({
    amount: "",
    currency: company?.baseCurrency || "INR",
    category: "Travel",
    description: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    vendorName: "",
    receiptImagePath: "",
    ocrMeta: null
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const previewUrl = form.receiptImagePath ? `${serverBaseUrl}${form.receiptImagePath}` : "";
  const numericAmount = Number(form.amount || 0);
  const autoApproveEligible = numericAmount > 0 && numericAmount < Number(company?.autoApproveAmount || 1000);
  const workflowPreview = company?.workflowSteps?.map((step) => step.label).join(" to ") || "Manager to Finance to Director";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleReceiptSelect = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
    setBanner({ type: "info", message: "" });
  };

  const handleRunOcr = async () => {
    if (!selectedFile) {
      setBanner({ type: "error", message: "Choose a receipt image before running OCR." });
      return;
    }

    setIsScanning(true);
    setBanner({ type: "info", message: "" });

    try {
      const uploadForm = new FormData();
      uploadForm.append("receipt", selectedFile);

      const response = await api.post("/expenses/ocr", uploadForm, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const extracted = response.data.data;
      setForm((current) => ({
        ...current,
        amount: extracted.extractedAmount ? String(extracted.extractedAmount) : current.amount,
        expenseDate: extracted.extractedDate ? normalizeDate(extracted.extractedDate) : current.expenseDate,
        vendorName: extracted.vendorName || current.vendorName,
        description: current.description || (extracted.vendorName ? `Receipt from ${extracted.vendorName}` : ""),
        receiptImagePath: extracted.receiptImagePath,
        ocrMeta: extracted
      }));
      setBanner({ type: "success", message: "OCR complete. Review the autofilled fields before submitting." });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBanner({ type: "info", message: "" });
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await api.post("/expenses", form);
      setForm({
        amount: "",
        currency: company?.baseCurrency || "INR",
        category: "Travel",
        description: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        vendorName: "",
        receiptImagePath: "",
        ocrMeta: null
      });
      setSelectedFile(null);
      setBanner({ type: "success", message: "Expense submitted successfully and routed for approval." });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
      setFieldErrors(extractFieldErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Expense"
        title="Submit a new reimbursement"
        description="Upload the receipt, review the auto-filled details, and send the request into your company approval flow."
        actions={<DownloadReportButton scope="my" label="Download my report" />}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="metric-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Company currency</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{company?.baseCurrency || "USD"}</p>
          <p className="mt-2 text-sm text-slate-500">All reimbursements are normalized to your workspace base currency.</p>
        </div>
        <div className="metric-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Approval path</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{workflowPreview}</p>
          <p className="mt-2 text-sm text-slate-500">The request moves forward step by step only after the current approver confirms it.</p>
        </div>
        <div className="metric-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick guide</p>
          <p className="mt-2 text-lg font-bold text-slate-950">Upload, review, submit</p>
          <p className="mt-2 text-sm text-slate-500">Use OCR to prefill the form, then confirm the final values before sending.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="card-shell space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Expense details</h2>
              <p className="mt-1 text-sm text-slate-500">Fill out the request carefully so approvers have the right context.</p>
            </div>
            <span className="mini-label">
              <ArrowRightLeft size={14} />
              Auto conversion enabled
            </span>
          </div>

          <AlertBanner type={banner.type} message={banner.message} />

          {autoApproveEligible ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              This amount is below your company auto-approve threshold of {company?.baseCurrency || "USD"} {company?.autoApproveAmount || 1000}. The expense will be auto-approved after submission.
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="amount">
                Amount
              </label>
              <input id="amount" name="amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={handleChange} className="field-input" placeholder="1250.00" />
              {fieldErrors.amount ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.amount}</p> : null}
            </div>
            <div>
              <label className="field-label" htmlFor="currency">
                Currency
              </label>
              <select id="currency" name="currency" required value={form.currency} onChange={handleChange} className="field-input">
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="category">
                Category
              </label>
              <select id="category" name="category" required value={form.category} onChange={handleChange} className="field-input">
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="expenseDate">
                Expense date
              </label>
              <input id="expenseDate" name="expenseDate" type="date" required value={form.expenseDate} onChange={handleChange} className="field-input" />
              {fieldErrors.expenseDate ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.expenseDate}</p> : null}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="vendorName">
              Vendor name
            </label>
            <input id="vendorName" name="vendorName" value={form.vendorName} onChange={handleChange} className="field-input" placeholder="Vendor or merchant" />
          </div>

          <div>
            <label className="field-label" htmlFor="description">
              Description
            </label>
              <textarea
                id="description"
                name="description"
                required
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="field-input"
              placeholder="Explain the business purpose of this expense"
            />
            {fieldErrors.description ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.description}</p> : null}
          </div>

          <div className="rounded-[1.75rem] border border-dashed border-brand-200 bg-brand-50/50 p-5 dark:border-brand-400/30 dark:bg-brand-500/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Receipt OCR</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Upload an image to extract amount, date, and vendor using local Tesseract OCR.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <ImageUp size={16} />
                  {selectedFile ? selectedFile.name : "Choose receipt"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleReceiptSelect} />
                </label>
                <button
                  type="button"
                  onClick={handleRunOcr}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isScanning ? <LoaderCircle size={16} className="animate-spin" /> : <ScanSearch size={16} />}
                  {isScanning ? "Scanning..." : "Run OCR"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/90 px-4 py-3 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Extract amount</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Receipt total</p>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-3 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Extract date</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Purchase date</p>
              </div>
              <div className="rounded-2xl bg-white/90 px-4 py-3 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Extract vendor</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Merchant name</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Receipt size={16} />
            {isSubmitting ? "Submitting..." : "Submit expense"}
          </button>
        </form>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <div className="card-shell">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/20 dark:text-brand-100">
                <WandSparkles size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Autofill preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">Review the extracted details before you send the claim.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <PreviewItem label="Detected amount" value={form.ocrMeta?.extractedAmount ? `${form.ocrMeta.extractedAmount}` : "Not detected yet"} />
              <PreviewItem label="Detected date" value={form.ocrMeta?.extractedDate || "Not detected yet"} />
              <PreviewItem label="Detected vendor" value={form.ocrMeta?.vendorName || "Not detected yet"} />
              <PreviewItem label="Company currency" value={company?.baseCurrency || "USD"} />
            </div>
          </div>

          <div className="card-shell border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-brand-50 text-slate-900 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">Submission checklist</p>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Describe the business purpose",
                  description: "A clear explanation helps managers approve faster."
                },
                {
                  title: "Confirm OCR suggestions",
                  description: "Check the detected amount, date, and vendor before you submit."
                },
                {
                  title: "Know what approvers will see",
                  description: "Your claim is shown in the original currency and in company currency."
                }
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-shell">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Receipt preview</h2>
            {previewUrl ? (
              <img src={previewUrl} alt="Receipt preview" className="mt-4 h-80 w-full rounded-3xl object-cover" />
            ) : (
              <div className="mt-4 flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                Upload a receipt to preview it here.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function normalizeDate(value) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const parts = value.split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [first, second, third] = parts;
    const normalizedYear = third.length === 2 ? `20${third}` : third;
    if (normalizedYear.length === 4) {
      return `${normalizedYear}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

export default SubmitExpensePage;
