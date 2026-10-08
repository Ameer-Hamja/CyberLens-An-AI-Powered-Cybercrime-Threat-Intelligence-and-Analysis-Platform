export const categoryLabel = (type) =>
  ({
    PHISHING: "Phishing",
    UPI_FRAUD: "UPI fraud",
    KYC_SCAM: "KYC scam",
    OTP_THEFT: "OTP theft",
    SIM_SWAP: "SIM swap",
    RANSOMWARE: "Ransomware",
    VISHING: "Vishing",
    OTHER: "Other",
  })[type] ||
  type ||
  "Uncategorized";
export const categoryColors = {
  PHISHING: "#22d3ee",
  UPI_FRAUD: "#818cf8",
  KYC_SCAM: "#fbbf24",
  OTP_THEFT: "#fb7185",
  SIM_SWAP: "#34d399",
  RANSOMWARE: "#f87171",
  VISHING: "#38bdf8",
  OTHER: "#64748b",
};
export function geoTags(incident) {
  try {
    return Array.isArray(incident.geoTags)
      ? incident.geoTags
      : JSON.parse(incident.geoTags || "[]");
  } catch {
    return [];
  }
}
export function filterIncidents(incidents, filters) {
  return incidents.filter(
    (item) =>
      (!filters.category || item.threatType === filters.category) &&
      (!filters.severity || item.severity >= Number(filters.severity)) &&
      (!filters.state || geoTags(item).includes(filters.state)) &&
      (!filters.date ||
        new Date(item.createdAt) >=
          new Date(Date.now() - Number(filters.date) * 86400000)) &&
      (!filters.query ||
        [
          item.id,
          item.citizenExplanation,
          categoryLabel(item.threatType),
          ...geoTags(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.query.toLowerCase())),
  );
}
export function dateLabel(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not available";
}
export function shortId(id) {
  return id ? "CL-" + id.slice(0, 8).toUpperCase() : "Unassigned";
}
export function safeSource(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    const placeholder =
      ["invalid", "test", "example", "localhost", "example.com", "example.org", "example.net", "test.crimelens.in"].some(
        (domain) => host === domain || host.endsWith("." + domain),
      );
    return ["https:", "http:"].includes(parsed.protocol) &&
      !placeholder
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
export function trendRows(data, days = 14) {
  const grouped = {};
  (data?.trends || []).forEach((item) => {
    grouped[item.date] = (grouped[item.date] || 0) + item.count;
  });
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - days + index + 1);
    const key = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");
    return { date: key, count: grouped[key] || 0 };
  });
}
