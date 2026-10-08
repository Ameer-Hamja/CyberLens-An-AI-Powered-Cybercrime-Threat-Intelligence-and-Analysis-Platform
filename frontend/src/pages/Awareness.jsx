import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Phone,
  Shield,
  Fingerprint,
  CreditCard,
  Smartphone,
  Mail,
  LockKeyhole,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeading from "../components/ui/PageHeading";
import { useToast } from "../components/ui/Toast";
const resources = [
  {
    title: "Spot a phishing message",
    category: "MESSAGES & EMAIL",
    icon: Mail,
    description:
      "Recognize impersonation, urgency, and suspicious links before you click.",
    tips: [
      "Inspect the sender and the full website address.",
      "Open your bank’s official app instead of message links.",
      "Report suspicious messages to the impersonated organization.",
    ],
  },
  {
    title: "Keep your OTP to yourself",
    category: "ACCOUNT SECURITY",
    icon: Fingerprint,
    description:
      "A one-time password is a key to your account. Treat it that way.",
    tips: [
      "Do not disclose login codes to callers or messages.",
      "Use multi-factor authentication where available.",
      "Contact your bank directly if an unfamiliar login occurs.",
    ],
  },
  {
    title: "Safer digital payments",
    category: "FINANCIAL SAFETY",
    icon: CreditCard,
    description: "Pause before approving an unexpected request for a payment.",
    tips: [
      "Verify requests through known contacts or official channels.",
      "Check transaction details before authorizing payments.",
      "Contact your bank promptly about suspicious activity.",
    ],
  },
  {
    title: "Protect your smartphone",
    category: "DEVICE HYGIENE",
    icon: Smartphone,
    description:
      "Small habits that make a meaningful difference to mobile security.",
    tips: [
      "Keep your device and apps updated.",
      "Install apps only from trusted stores.",
      "Review unnecessary app permissions.",
    ],
  },
  {
    title: "Build stronger account security",
    category: "DIGITAL IDENTITY",
    icon: LockKeyhole,
    description:
      "Protect access to your digital life with stronger authentication.",
    tips: [
      "Use unique passwords for important accounts.",
      "Enable multi-factor authentication.",
      "Keep recovery contact details current.",
    ],
  },
  {
    title: "Respond to a suspected scam",
    category: "INCIDENT RESPONSE",
    icon: Shield,
    description:
      "Preserve the facts and use verified channels to ask for help.",
    tips: [
      "Save the original messages and transaction details.",
      "Contact your bank using its official customer-care number.",
      "Report financial cyber fraud through 1930 or the official portal.",
    ],
  },
];
export default function Awareness() {
  const [selected, setSelected] = useState(null),
    toast = useToast(),
    close = useCallback(() => setSelected(null), []);
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="KNOWLEDGE IS YOUR FIRST DEFENSE"
        title="Stay informed. Stay protected."
        description="Practical guidance for a safer digital life, grounded in official awareness resources."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-cyan-500/20 p-6 sm:p-8 lg:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 flex h-64 w-64 items-center justify-center rounded-full border border-cyan-500/10 bg-cyan-500/[0.04]"
          >
            <Shield size={120} strokeWidth={0.5} className="text-cyan-500/20" />
          </div>
          <Badge tone="cyan">SCAM OF THE WEEK · AWARENESS SPOTLIGHT</Badge>
          <h2 className="relative mt-6 max-w-md text-2xl font-semibold tracking-tight">
            “Update your KYC.
            <br />
            Or lose access to your account.”
          </h2>
          <p className="relative mt-4 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
            Urgency and a banking logo can make a fake message look convincing.
            Verify KYC requests through your bank’s official channels.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setSelected(resources[0]);
                toast("Phishing awareness guide opened.");
              }}
            >
              Learn the warning signs <ArrowUpRight size={15} />
            </Button>
            <Link to="/scan" className="btn-ghost">
              Check a message
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col justify-between border-emerald-500/20 bg-emerald-500/[0.04] p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Phone size={17} />
              Help is a call away.
            </div>
            <a
              href="tel:1930"
              onClick={() => toast("Opening your phone to call 1930.")}
              className="mt-6 block font-mono text-5xl font-medium tracking-tight"
            >
              1930
            </a>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              National financial cyber fraud helpline
            </p>
          </div>
          <Link
            to="/report"
            className="mt-6 flex items-center justify-between rounded-xl border border-emerald-500/20 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            Prepare a cybercrime report <ArrowUpRight size={15} />
          </Link>
        </Card>
      </div>
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Build your digital defenses
        </h2>
        <span className="hidden font-mono text-[10px] text-slate-600 dark:text-slate-400 sm:block">
          6 ESSENTIAL GUIDES
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource, index) => (
          <Card
            key={resource.title}
            className="group flex min-h-64 flex-col p-6 transition-all hover:-translate-y-1 hover:border-cyan-500/30"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3 text-cyan-700 dark:text-cyan-400">
                <resource.icon size={21} />
              </span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
                0{index + 1}
              </span>
            </div>
            <p className="mt-6 font-mono text-[9px] tracking-wider text-slate-600 dark:text-slate-400">
              {resource.category}
            </p>
            <h3 className="mt-2 text-sm font-semibold">{resource.title}</h3>
            <p className="mt-3 flex-1 text-xs leading-6 text-slate-600 dark:text-slate-400">
              {resource.description}
            </p>
            <button
              onClick={() => {
                setSelected(resource);
                toast("Awareness guide opened.");
              }}
              className="mt-5 flex items-center justify-between rounded-lg text-xs font-medium text-cyan-700 dark:text-cyan-400"
            >
              Read guide <ArrowUpRight size={15} />
            </button>
          </Card>
        ))}
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-slate-600 dark:text-slate-400" />
          <div>
            <p className="text-xs font-semibold">
              Continue learning with CERT-In
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Official cyber security awareness booklets and resources.
            </p>
          </div>
        </div>
        <a
          href="https://cert-in.org.in/AwarenessBooklets.jsp"
          target="_blank"
          rel="noreferrer"
          onClick={() => toast("Opening CERT-In awareness resources.")}
          className="btn-ghost text-xs"
        >
          Explore official resources <ExternalLink size={14} />
        </a>
      </Card>
      <Modal
        open={!!selected}
        onClose={close}
        title={selected?.title || "Awareness guide"}
      >
        {selected && (
          <div className="space-y-6">
            <Badge tone="cyan">{selected.category}</Badge>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              {selected.description}
            </p>
            <ul className="space-y-4">
              {selected.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-emerald-500"
                  />
                  {tip}
                </li>
              ))}
            </ul>
            <a
              href="https://www.cert-in.org.in/PDF/Sr_Citizen_Cyber_Security_booklet.pdf"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost w-full"
            >
              Source: CERT-In awareness booklet <ExternalLink size={14} />
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
