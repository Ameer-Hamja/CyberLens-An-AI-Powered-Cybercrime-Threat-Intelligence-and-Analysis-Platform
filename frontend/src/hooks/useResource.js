import { useCallback, useEffect, useRef, useState } from "react";
export function useResource(loader) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const version = useRef(0);
  const reload = useCallback(async () => {
    const current = ++version.current;
    setLoading(true);
    try {
      const value = await loader();
      if (current === version.current) {
        setData(value);
        setError(null);
      }
      return true;
    } catch (e) {
      if (current === version.current)
        setError(
          e.response?.data?.error ||
            "Unable to reach the intelligence service. Please try again.",
        );
      return false;
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    reload();
    const requestVersion = version;
    return () => {
      requestVersion.current++;
    };
  }, [reload]);
  return { data, setData, loading, error, reload };
}
