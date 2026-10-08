import api from "./axios";
export async function fetchAllIncidents() {
  const first = (
    await api.get("/api/incidents", { params: { page: 0, size: 100 } })
  ).data.data;
  const content = [...first.content];
  for (let page = 1; page < first.totalPages; page += 4) {
    const pages = await Promise.all(
      Array.from(
        { length: Math.min(4, first.totalPages - page) },
        (_, offset) =>
          api.get("/api/incidents", {
            params: { page: page + offset, size: 100 },
          }),
      ),
    );
    content.push(...pages.flatMap((response) => response.data.data.content));
  }
  return [...new Map(content.map((item) => [item.id, item])).values()];
}
