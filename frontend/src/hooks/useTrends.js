import { useCallback } from "react";
import { fetchTrends } from "../api/threats";
import { useResource } from "./useResource";
export function useTrends(days = 30) {
  const loader = useCallback(() => fetchTrends(days), [days]);
  return useResource(loader);
}
