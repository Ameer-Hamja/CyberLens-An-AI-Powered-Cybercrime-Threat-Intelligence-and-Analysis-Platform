import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Phone,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageHeading from "../components/ui/PageHeading";
import { useToast } from "../components/ui/Toast";
import { THREAT_TYPES } from "../utils/constants";
import { categoryLabel } from "../utils/intelligence";
const steps = [
  "Incident type",
  "What happened",
  "Your details",
  "Review & prepare",
];
export default function Report() {
  const [step, setStep] = useState(0),
    [prepared, setPrepared] = useState(false),
    [data, setData] = useState({
      category: "",
      title: "",
      date: "",
      state: "",
      description: "",
      amount: "",
      evidence: "",
      name: "",
      email: "",
      phone: "",
      consent: false,
    }),
    [errors, setErrors] = useState({});
  const form = useRef(null),
    toast = useToast();
  const update = (key, value) => {
    setData((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: null }));
  };
  function next(event) {
    event.preventDefault();
    const invalid = [...form.current.elements].filter(
      (element) => element.willValidate && !element.validity.valid,
    );
    if (invalid.length) {
      setErrors(
        Object.fromEntries(
          invalid.map((element) => [element.name, element.validationMessage]),
        ),
      );
      invalid[0].focus();
      toast("Please complete the highlighted fields.", "error");
      return;
    }
    setErrors({});
    setStep((previous) => previous + 1);
    toast(`${steps[step]} saved for review.`);
  }
  function download() {
    const text = [
      "CYBERLENS — CYBERCRIME REPORT SUMMARY",
      "Prepared: " + new Date().toLocaleString("en-IN"),
      "Status: Prepared locally; not submitted to authorities.",
      "",
      ...Object.entries(data)
        .filter(([key]) => key !== "consent")
        .map(
          ([key, value]) =>
            key.toUpperCase() +
            ": " +
            (key === "category"
              ? categoryLabel(value)
              : value || "Not provided"),
        ),
      "",
      "Complete official reporting at https://www.cybercrime.gov.in/Webform/Index.aspx",
      "Financial cyber fraud helpline: 1930",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberlens-report-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
    setPrepared(true);
    toast("Report summary downloaded. Complete filing on the official portal.");
  }
  const field = (key, label, props = {}) => (
    <div>
      <label htmlFor={"report-" + key} className="field-label">
        {label}
      </label>
      <input
        id={"report-" + key}
        name={key}
        value={data[key]}
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? key + "-error" : undefined}
        className="input"
        {...props}
      />
      {errors[key] && (
        <p id={key + "-error"} className="mt-2 text-xs text-red-600 dark:text-red-400">
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeading
        eyebrow="CITIZEN SUPPORT"
        title="Take the first step."
        description="Organize the facts, preserve your evidence, and prepare a clear cybercrime report."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <ol
              aria-label="Report progress"
              className="flex items-start justify-between gap-2"
            >
              {steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={step === index ? "step" : undefined}
                  className="flex flex-1 flex-col items-center gap-3 text-center"
                >
                  <span
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs " +
                      (index <= step
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                        : "border-slate-200 text-slate-600 dark:text-slate-400 dark:border-slate-700")
                    }
                  >
                    {index < step ? (
                      <Check size={16} />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span
                    className={
                      "text-[10px] " +
                      (index === step ? "font-semibold" : "text-slate-600 dark:text-slate-400")
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <div
              role="progressbar"
              aria-label="Report completion"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={step + 1}
              className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <div
                className="h-full bg-cyan-500 transition-[width] duration-300"
                style={{ width: ((step + 1) / 4) * 100 + "%" }}
              />
            </div>
          </Card>
          <Card className="min-h-[480px] p-6 sm:p-8">
            {prepared ? (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <span className="rounded-2xl bg-emerald-500/10 p-5 text-emerald-500">
                  <CheckCircle2 size={36} />
                </span>
                <h2 className="mt-6 text-xl font-semibold">
                  Your report summary is ready.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                  The summary was downloaded to your device. Your report has not
                  been submitted. Use it to complete your complaint on the
                  National Cyber Crime Reporting Portal.
                </p>
                <a
                  href="https://www.cybercrime.gov.in/Webform/Index.aspx"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    toast("Opening the official reporting portal.")
                  }
                  className="btn-primary mt-6"
                >
                  <ExternalLink size={16} />
                  Continue to official portal
                </a>
                <Button variant="ghost" className="mt-3" onClick={download}>
                  <Download size={15} />
                  Download again
                </Button>
              </div>
            ) : (
              <form ref={form} noValidate onSubmit={next} className="space-y-6">
                <div>
                  <Badge tone="cyan">STEP {step + 1} OF 4</Badge>
                  <h2 className="mt-4 text-lg font-semibold">
                    {
                      [
                        "What kind of incident occurred?",
                        "Tell us what happened.",
                        "How can authorities contact you?",
                        "Review your report summary.",
                      ][step]
                    }
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
                    {
                      [
                        "Choose the closest category. You can add context in the next step.",
                        "Include key dates, messages, and transaction references. Do not enter passwords or OTPs.",
                        "These details are included only in your downloaded summary.",
                        "Check the information before downloading and proceeding to the official portal.",
                      ][step]
                    }
                  </p>
                </div>
                {step === 0 && (
                  <>
                    <div>
                      <label htmlFor="report-category" className="field-label">
                        Incident category *
                      </label>
                      <select
                        id="report-category"
                        name="category"
                        value={data.category}
                        onChange={(event) =>
                          update("category", event.target.value)
                        }
                        required
                        aria-invalid={!!errors.category}
                        className="input"
                      >
                        <option value="">Select a category</option>
                        {THREAT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {categoryLabel(type)}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                          Choose an incident category.
                        </p>
                      )}
                    </div>
                    {field("title", "Brief incident title *", {
                      required: true,
                      minLength: 8,
                      maxLength: 160,
                      placeholder:
                        "e.g. Unauthorized UPI payment after a refund call",
                    })}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {field("date", "Incident date *", {
                        type: "date",
                        required: true,
                        max: new Date().toLocaleDateString("en-CA"),
                      })}
                      {field("state", "State / union territory *", {
                        required: true,
                        minLength: 2,
                        maxLength: 100,
                        placeholder: "e.g. Maharashtra",
                      })}
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div>
                      <label
                        htmlFor="report-description"
                        className="field-label"
                      >
                        Incident description *
                      </label>
                      <textarea
                        id="report-description"
                        name="description"
                        value={data.description}
                        onChange={(event) =>
                          update("description", event.target.value)
                        }
                        required
                        minLength={30}
                        maxLength={4000}
                        rows={6}
                        className="input"
                        placeholder="Describe what happened, how you were contacted, and what action was taken."
                        aria-invalid={!!errors.description}
                      />
                      <div className="mt-2 flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                        <span>At least 30 characters</span>
                        <span className="font-mono">
                          {data.description.length}/4000
                        </span>
                      </div>
                      {errors.description && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                          {errors.description}
                        </p>
                      )}
                    </div>
                    {field("amount", "Financial loss (₹), if applicable", {
                      type: "number",
                      min: 0,
                      max: 1000000000,
                      step: 0.01,
                      placeholder: "0.00",
                    })}
                    <div>
                      <label htmlFor="report-evidence" className="field-label">
                        Evidence & transaction references
                      </label>
                      <textarea
                        id="report-evidence"
                        name="evidence"
                        value={data.evidence}
                        onChange={(event) =>
                          update("evidence", event.target.value)
                        }
                        rows={3}
                        maxLength={2000}
                        className="input"
                        placeholder="List screenshots, message dates, URLs, or transaction IDs to provide on the official portal."
                      />
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    {field("name", "Full name *", {
                      required: true,
                      minLength: 2,
                      maxLength: 120,
                      autoComplete: "name",
                    })}
                    {field("email", "Email address *", {
                      type: "email",
                      required: true,
                      autoComplete: "email",
                    })}
                    {field("phone", "Mobile number *", {
                      type: "tel",
                      required: true,
                      pattern: "[6-9][0-9]{9}",
                      maxLength: 10,
                      autoComplete: "tel-national",
                      placeholder: "10-digit Indian mobile number",
                    })}
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <input
                        name="consent"
                        type="checkbox"
                        required
                        checked={data.consent}
                        onChange={(event) =>
                          update("consent", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-cyan-500"
                      />
                      <span className="text-xs leading-6 text-slate-600 dark:text-slate-400">
                        I understand this prepares a local summary. I will file
                        the complaint through the official portal.
                      </span>
                    </label>
                    {errors.consent && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Please acknowledge the reporting process.
                      </p>
                    )}
                  </>
                )}
                {step === 3 && (
                  <dl className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                    {[
                      ["Category", categoryLabel(data.category)],
                      ["Title", data.title],
                      ["Date & location", data.date + " · " + data.state],
                      ["Description", data.description],
                      [
                        "Financial loss",
                        data.amount
                          ? "₹" + Number(data.amount).toLocaleString("en-IN")
                          : "Not specified",
                      ],
                      [
                        "Contact",
                        data.name + " · " + data.email + " · " + data.phone,
                      ],
                      ["Evidence", data.evidence || "Not specified"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {label}
                        </dt>
                        <dd className="mt-1.5 break-words text-xs leading-6">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    disabled={!step}
                    onClick={() => {
                      setStep(step - 1);
                      toast("Previous report step.");
                    }}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button type="submit">
                      Continue
                      <ArrowRight size={15} />
                    </Button>
                  ) : (
                    <Button onClick={download}>
                      <Download size={15} />
                      Download report summary
                    </Button>
                  )}
                </div>
              </form>
            )}
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/[0.04] p-6">
            <Phone size={24} className="text-amber-500" />
            <h2 className="mt-4 text-sm font-semibold">
              Financial fraud? Act promptly.
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
              Contact the financial cyber fraud helpline and your bank through
              its official channels.
            </p>
            <a
              href="tel:1930"
              onClick={() => toast("Opening your phone to call 1930.")}
              className="mt-5 block font-mono text-4xl font-medium text-amber-700 dark:text-amber-400"
            >
              1930
            </a>
            <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-400">
              National financial cyber fraud helpline
            </p>
          </Card>
          <Card className="p-6">
            <ShieldCheck size={23} className="text-emerald-500" />
            <h2 className="mt-4 text-sm font-semibold">
              Keep your evidence intact.
            </h2>
            <ul className="mt-4 space-y-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
              <li>Save original messages and screenshots.</li>
              <li>Note transaction IDs and timestamps.</li>
              <li>Keep suspicious links without opening them.</li>
              <li>Never include passwords, PINs, or OTPs.</li>
            </ul>
          </Card>
          <Card className="p-6">
            <FileText size={22} className="text-cyan-500" />
            <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
              Your draft stays in this tab until you download it. Closing or
              refreshing the page clears the form.
            </p>
            <a
              href="https://www.cybercrime.gov.in/Webform/Index.aspx"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs text-cyan-700 dark:text-cyan-400"
            >
              Official reporting portal <ExternalLink size={12} />
            </a>
          </Card>
        </aside>
      </div>
    </div>
  );
}
