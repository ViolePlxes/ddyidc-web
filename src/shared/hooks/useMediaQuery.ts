import { useEffect, useState } from "react";

/**
 * Live media-query match. The initial value is read synchronously so the first
 * paint already uses the correct layout and no table/card flash occurs.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** Same breakpoint as the desktop three-column catalog (`xl`). */
export const CATALOG_DESKTOP_QUERY = "(min-width: 1280px)";

/** `true` only when the desktop three-column catalog layout applies. */
export function useCatalogDesktopLayout() {
  return useMediaQuery(CATALOG_DESKTOP_QUERY);
}
