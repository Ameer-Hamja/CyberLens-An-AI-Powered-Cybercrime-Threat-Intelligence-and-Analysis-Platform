import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Link2,
  Image,
  ShieldCheck,
  ArrowRight,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Fingerprint,
  ExternalLink,
} from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import PageHeading from "../components/ui/PageHeading";
import { useToast } from "../components/ui/Toast";
import { useResource } from "../hooks/useResource";
import { scanText, scanImage, fetchScanHistory } from "../api/scan";
import RiskMeter from "../components/scanner/RiskMeter";
import { categoryLabel } from "../utils/intelligence";
const examples = [
  "Your SBI KYC has expired. Click this link and share your OTP to keep your account active.",
  "Congratulations! You won ₹50,000. Transfer a processing fee to collect your prize.",
  "Your UPI account will be blocked. Share your payment PIN to verify your account.",
];
export default function Scan() {
  const [tab, setTab] = useState("text"),
    [input, setInput] = useState(""),
    [file, setFile] = useState(null),
    [result, setResult] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(null),
    [dragging, setDragging] = useState(false);
  const toast = useToast(),
    history = useResource(fetchScanHistory);
  function chooseFile(next) {
    if (!next) return;
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
      ].includes(next.type)
    ) {
      setError("Choose a JPG, PNG, WebP, GIF, or BMP image.");
      toast("Unsupported image type.", "error");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      toast("Image exceeds the 10 MB limit.", "error");
      return;
    }
    setFile(next);
    setError(null);
    toast("Image selected for analysis.");
  }
  async function scan(event) {
    event.preventDefault();
    if (tab === "image" && !file) {
      setError("Select an image to analyze.");
      toast("Please select an image.", "error");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data =
        tab === "image" ? await scanImage(file) : await scanText(input.trim());
      setResult(data);
      toast("Analysis completed. Review the risk signals below.");
      history.reload();
    } catch (e) {
      const message =
        e.response?.data?.error || "Analysis is unavailable. Please try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }
  function switchTab(value) {
    setTab(value);
    setResult(null);
    setError(null);
  }
  const indicators =
    tab === "image"
      ? (result?.signals || [])
          .filter((signal) => signal.detected)
          .map((signal) => signal.name + ": " + signal.detail)
      : result?.indicators || [];
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="YOUR DIGITAL SECOND OPINION"
        title="Pause. Check. Stay protected."
        description="Analyze a suspicious message, link, payment ID, or image before you act."
        action={
          <Badge tone="emerald" dot>
            No account required
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-3">
          <div
            role="tablist"
            aria-label="Scan input type"
            className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950"
          >
            {[
              { key: "text", label: "Message", icon: MessageSquare },
              { key: "url", label: "URL / UPI", icon: Link2 },
              { key: "image", label: "Image", icon: Image },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={"tab-" + key}
                role="tab"
                aria-selected={tab === key}
                aria-controls="scan-panel"
                disabled={loading}
                onClick={() => switchTab(key)}
                className={
                  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors " +
                  (tab === key
                    ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100")
                }
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <form
            onSubmit={scan}
            id="scan-panel"
            role="tabpanel"
            aria-labelledby={"tab-" + tab}
            className="mt-6 space-y-5"
          >
            {tab === "image" ? (
              <>
                <label
                  htmlFor="scan-file"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    chooseFile(event.dataTransfer.files[0]);
                  }}
                  className={
                    "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors " +
                    (dragging
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-300 bg-slate-50/50 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-950/40")
                  }
                >
                  <span className="rounded-2xl bg-cyan-500/10 p-4 text-cyan-500">
                    <Upload size={28} />
                  </span>
                  <span className="mt-4 text-sm font-medium">
                    Drop an image here, or choose a file
                  </span>
                  <span className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                    JPG, PNG, WebP, GIF, BMP · up to 10 MB
                  </span>
                  <input
                    id="scan-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                    onChange={(event) => chooseFile(event.target.files[0])}
                    className="mt-5 max-w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:px-3 file:py-2 file:text-cyan-700 dark:file:text-cyan-300"
                    disabled={loading}
                  />
                </label>
                {file && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
                    <span className="min-w-0 truncate">
                      {file.name} · {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        document.getElementById("scan-file").value = "";
                        toast("Image removed.");
                      }}
                      aria-label="Remove selected image"
                      className="rounded p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="scan-input" className="field-label">
                    {tab === "text"
                      ? "Paste the suspicious message"
                      : "Enter a URL or UPI ID"}
                  </label>
                  <textarea
                    id="scan-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    minLength={3}
                    maxLength={2000}
                    required
                    rows={7}
                    disabled={loading}
                    placeholder={
                      tab === "text"
                        ? "Paste a suspicious SMS, WhatsApp message, or email here…"
                        : "Paste a suspicious link or UPI ID here…"
                    }
                    className="input resize-y !font-mono !text-xs !leading-7"
                  />
                  <p className="mt-2 text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    {input.length} / 2000
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Try an example
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((example, index) => (
                      <button
                        key={example}
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setInput(example);
                          setTab("text");
                          setResult(null);
                          toast(
                            "Example loaded. Run a scan to see the analysis.",
                          );
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-600 dark:text-slate-400 hover:border-cyan-500/40 hover:text-cyan-600 dark:border-slate-700 dark:hover:text-cyan-400"
                      >
                        {["KYC message", "Prize scam", "UPI warning"][index]}{" "}
                        <ArrowRight size={10} className="ml-1 inline" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs leading-6 text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || (tab === "image" ? !file : input.trim().length < 3)
              }
            >
              <ScanLine size={17} />
              {loading
                ? "Analyzing…"
                : tab === "image"
                  ? "Analyze image"
                  : "Analyze " + (tab === "text" ? "message" : "URL / UPI")}
              <ArrowRight size={15} />
            </Button>
            <p className="flex items-start justify-center gap-2 text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
              <Fingerprint size={13} className="shrink-0" />
              Do not include passwords, PINs, or private account credentials.
            </p>
          </form>
        </Card>
        <Card className="flex min-h-[500px] flex-col xl:col-span-2">
          <CardHeader
            title="Your risk assessment"
            description="Understand the signals before you decide"
            action={<ShieldCheck size={17} className="text-cyan-500" />}
          />
          <div className="flex-1 p-6">
            <RiskMeter
              score={result?.riskScore}
              empty={!result && !loading}
              pending={loading}
            />
            {loading ? (
              <div
                className="mt-8 space-y-4"
                role="status"
                aria-label="Analysis in progress"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : result ? (
              <div className="mt-6 space-y-5 animate-fade-in">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={
                      result.riskScore >= 60
                        ? "red"
                        : result.riskScore >= 40
                          ? "amber"
                          : "emerald"
                    }
                  >
                    {tab === "image"
                      ? result.verdict?.replaceAll("_", " ")
                      : categoryLabel(result.threatType)}
                  </Badge>
                  {result.classifierUsed?.includes("fallback") && (
                    <Badge tone="amber">Limited analysis</Badge>
                  )}
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {result.explanation}
                </p>
                {indicators.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Detected signals
                    </h3>
                    <ul className="space-y-3">
                      {indicators.map((indicator, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-xs leading-6 text-slate-600 dark:text-slate-400"
                        >
                          <AlertTriangle
                            size={14}
                            className="mt-1 shrink-0 text-amber-500"
                          />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tab === "image" && result.ocrText && (
                  <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <summary className="cursor-pointer text-xs font-medium">
                      Extracted image text
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words font-mono text-[10px] leading-6 text-slate-600 dark:text-slate-400">
                      {result.ocrText}
                    </p>
                  </details>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    setInput("");
                    setFile(null);
                    toast("Ready for another scan.");
                  }}
                >
                  Start another scan
                </Button>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-medium">
                  A little context goes a long way.
                </p>
                <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
                  Include the full message for a useful assessment. A low score
                  is not a guarantee of safety; verify unfamiliar requests
                  independently.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-5 text-[10px] text-slate-600 dark:text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Anonymous scan statistics
            </span>
            <span className="font-mono">
              {history.data?.totalScans?.toLocaleString("en-IN") || "—"} SCANS
            </span>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: MessageSquare,
            title: "Share the context",
            text: "Messages, links, and images can carry different warning signals.",
          },
          {
            icon: ShieldCheck,
            title: "Understand the result",
            text: "Read the explanation and indicators alongside the risk score.",
          },
          {
            icon: ExternalLink,
            title: "Know your next step",
            text: "If you suspect fraud, preserve evidence and use verified reporting channels.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-6">
            <Icon size={20} className="text-cyan-500" />
            <h2 className="mt-4 text-xs font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
              {text}
            </p>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Lost money to a suspected scam? Call{" "}
          <a
            href="tel:1930"
            className="font-mono font-semibold text-amber-700 dark:text-amber-400"
          >
            1930
          </a>{" "}
          and contact your bank.
        </p>
        <Link
          to="/report"
          className="text-xs font-semibold text-amber-700 dark:text-amber-400"
        >
          Prepare a report <ArrowUpRightIcon />
        </Link>
      </div>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={13} className="ml-1 inline -rotate-45" />;
}
