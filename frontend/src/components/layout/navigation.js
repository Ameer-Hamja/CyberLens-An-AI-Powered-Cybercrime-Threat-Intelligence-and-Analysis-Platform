import {
  LayoutDashboard,
  Map,
  ListFilter,
  ScanLine,
  FileText,
  BookOpen,
  TrendingUp,
} from "lucide-react";
export const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/heatmap", label: "Live heatmap", icon: Map },
  { to: "/incidents", label: "Incidents", icon: ListFilter },
  { to: "/scan", label: "Scam checker", icon: ScanLine },
  { to: "/report", label: "Report cybercrime", icon: FileText },
  { to: "/awareness", label: "Awareness hub", icon: BookOpen },
  { to: "/trends", label: "Trends & insights", icon: TrendingUp },
];
