import { useEffect, useState } from "react";
import { search } from "../services/searchService";

export function useSearch(query, delay = 250) {
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(async () => {
      const res = await search(query);
      setResults(res);
      setSearching(false);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [query, delay]);

  return { results, searching };
}
