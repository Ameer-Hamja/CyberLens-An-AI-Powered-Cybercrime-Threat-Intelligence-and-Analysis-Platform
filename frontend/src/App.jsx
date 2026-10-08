import { lazy, Suspense, useCallback, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import PageWrapper from "./components/layout/PageWrapper";
import BottomNav from "./components/layout/BottomNav";
import Modal from "./components/ui/Modal";
import Skeleton from "./components/ui/Skeleton";
import { navigation } from "./components/layout/navigation";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LiveHeatmap = lazy(() => import("./pages/LiveHeatmap"));
const Incidents = lazy(() => import("./pages/Incidents"));
const IncidentDetail = lazy(() => import("./pages/IncidentDetail"));
const Report = lazy(() => import("./pages/Report"));
const Scan = lazy(() => import("./pages/Scan"));
const Awareness = lazy(() => import("./pages/Awareness"));
const Trends = lazy(() => import("./pages/Trends"));
const NotFound = lazy(() => import("./pages/NotFound"));
export default function App() {
  const [collapsed, setCollapsed] = useState(
      () => localStorage.getItem("cyberlens_sidebar") === "collapsed",
    ),
    [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  function toggleSidebar() {
    setCollapsed((value) => {
      localStorage.setItem(
        "cyberlens_sidebar",
        value ? "expanded" : "collapsed",
      );
      return !value;
    });
  }
  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[2000] rounded-lg bg-cyan-500 p-3 text-sm text-slate-950 focus:not-sr-only"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <PageWrapper>
          <Suspense
            fallback={
              <div
                role="status"
                aria-label="Loading page"
                className="space-y-6"
              >
                <Skeleton className="h-12 w-2/3" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/heatmap" element={<LiveHeatmap />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/report" element={<Report />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/awareness" element={<Awareness />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/search" element={<Incidents searchMode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageWrapper>
      </div>
      <BottomNav onMenu={() => setMenu(true)} />
      <Modal open={menu} onClose={closeMenu} title="Your workspace">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={closeMenu}
            className="flex min-h-14 items-center gap-3 rounded-xl px-4 text-sm hover:bg-cyan-500/5"
          >
            <Icon size={18} className="text-cyan-500" />
            {label}
          </Link>
        ))}
      </Modal>
    </div>
  );
}
