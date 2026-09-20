import { useLocation } from 'react-router-dom';

// Detail pages remain quiet while idle; explicit cache invalidations still work.
export function useInstanceDetailRoute() {
  const { pathname } = useLocation();
  return /^\/(?:console\/instances\/[^/]+|user\/instance\/[^/]+\.htm|admin\/customers\/[^/]+\/instances\/[^/]+)\/?$/.test(pathname);
}
