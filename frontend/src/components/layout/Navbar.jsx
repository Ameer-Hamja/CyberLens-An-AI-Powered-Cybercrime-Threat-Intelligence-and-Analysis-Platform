import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Shield,
  UserRound,
  LogOut,
  ArrowUpRight,
  Radio,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSocket } from "../../context/WebSocketContext";
import { useIntelligence } from "../../context/IntelligenceContext";
import { useToast } from "../ui/Toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import api from "../../api/axios";
import { shortId, categoryLabel } from "../../utils/intelligence";
export default function Navbar() {
  const { theme, toggleTheme } = useTheme(),
    { connected } = useSocket(),
    { unread, alerts, markRead } = useIntelligence(),
    toast = useToast(),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [panel, setPanel] = useState(null),
    [userMenu, setUserMenu] = useState(false),
    [user, setUser] = useState(() => localStorage.getItem("crimelens_user")),
    [busy, setBusy] = useState(false),
    [authError, setAuthError] = useState(null),
    [register, setRegister] = useState(false);
  const close = useCallback(() => setPanel(null), []);
  async function authenticate(event) {
    event.preventDefault();
    setBusy(true);
    setAuthError(null);
    const form = new FormData(event.currentTarget);
    const body = {
      username: form.get("username"),
      password: form.get("password"),
    };
    try {
      if (register) await api.post("/api/auth/register", body);
      const response = await api.post("/api/auth/login", body);
      localStorage.setItem("crimelens_token", response.data.data.token);
      localStorage.setItem("crimelens_user", body.username);
      setUser(body.username);
      close();
      toast(
        register
          ? "Account created. You are signed in."
          : "Signed in successfully.",
      );
    } catch (error) {
      const message =
        error.response?.data?.error || "Unable to sign in. Please try again.";
      setAuthError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* Local token removal still signs out this browser. */
    }
    localStorage.removeItem("crimelens_token");
    localStorage.removeItem("crimelens_user");
    setUser(null);
    setUserMenu(false);
    toast("Signed out of this browser.");
  }
  return (
    <>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-6 xl:px-8">
        <div className="hidden items-center gap-2 text-xs text-slate-600 dark:text-slate-400 lg:flex">
          <span>Workspace</span>
          <span className="px-2 text-slate-300 dark:text-slate-700">/</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">
            India intelligence
          </span>
          <Badge tone="slate">IN</Badge>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 md:hidden"
          aria-label="CyberLens"
        >
          <Shield size={22} className="text-cyan-500" />
          <span className="font-semibold">CyberLens</span>
        </Link>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim().length >= 2) {
              navigate("/search?q=" + encodeURIComponent(query.trim()));
              setQuery("");
              toast("Searching intelligence records.");
            }
          }}
          className="relative hidden max-w-sm flex-1 sm:block"
        >
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-3.5 text-slate-600 dark:text-slate-400"
          />
          <input
            aria-label="Search intelligence"
            minLength={2}
            maxLength={200}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search intelligence…"
            className="input !min-h-10 !py-2 !pl-10 !text-xs"
          />
        </form>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 text-[11px] font-medium sm:inline-flex">
            <span
              className={
                connected
                  ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "h-1.5 w-1.5 rounded-full bg-amber-500"
              }
            />
            <span className="text-slate-600 dark:text-slate-400">
              {connected ? "Live intelligence" : "Reconnecting"}
            </span>
          </span>
          <button
            onClick={() => {
              toggleTheme();
              toast(
                theme === "dark" ? "Light mode enabled." : "Dark mode enabled.",
              );
            }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded-xl p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => {
              setPanel("alerts");
              markRead();
            }}
            aria-label={`Notifications, ${unread} unread live alerts`}
            className="relative rounded-xl p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[9px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <div className="relative border-l border-slate-200 pl-3 dark:border-slate-800">
            <button
              onClick={() => setUserMenu(!userMenu)}
              aria-expanded={userMenu}
              aria-label="User menu"
              className="flex items-center gap-2 rounded-xl"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <UserRound size={17} />
              </span>
              <span className="hidden text-left text-xs xl:block">
                <span className="block font-medium">
                  {user || "Guest workspace"}
                </span>
                <span className="mt-1 block text-[10px] text-slate-600 dark:text-slate-400">
                  {user ? "Signed in" : "Public intelligence"}
                </span>
              </span>
              <ChevronDown size={14} className="text-slate-600 dark:text-slate-400" />
            </button>
            {userMenu && (
              <div className="card absolute right-0 top-12 w-48 p-2 shadow-xl">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full !justify-start"
                    onClick={logout}
                  >
                    <LogOut size={15} />
                    Sign out
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full !justify-start"
                    onClick={() => {
                      setUserMenu(false);
                      setPanel("auth");
                    }}
                  >
                    <UserRound size={15} />
                    Sign in / register
                  </Button>
                )}
                <Link
                  to="/report"
                  onClick={() => setUserMenu(false)}
                  className="btn-ghost w-full !justify-start"
                >
                  <ArrowUpRight size={15} />
                  Report cybercrime
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <Modal
        open={panel === "alerts"}
        onClose={close}
        title="Live notifications"
        drawer
      >
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Radio size={15} className="text-emerald-500" />
          New incidents received during this session
        </div>
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((item) => (
              <Link
                key={item.id}
                to={"/incidents/" + item.id}
                onClick={close}
                className="card block p-4 hover:border-cyan-500/40"
              >
                <p className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400">
                  {shortId(item.id)}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {categoryLabel(item.threatType)}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.citizenExplanation}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You’re up to date"
            description="New incidents will appear here as they arrive on the live intelligence stream."
          />
        )}
      </Modal>
      <Modal
        open={panel === "auth"}
        onClose={close}
        title={register ? "Create your account" : "Welcome to CyberLens"}
      >
        <form onSubmit={authenticate} className="space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Public intelligence is available without signing in.
          </p>
          <div>
            <label htmlFor="username" className="field-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              minLength={register ? 3 : 1}
              maxLength={100}
              pattern={register ? "[A-Za-z0-9_]+" : undefined}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password{register ? " · at least 12 characters" : ""}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={register ? 12 : 1}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
              className="input"
            />
          </div>
          {authError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {authError}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : register ? "Create account" : "Sign in"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setRegister(!register);
              setAuthError(null);
            }}
          >
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
