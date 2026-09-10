import axios from "axios";
import type { AuthPayload } from "../types/auth";
import type { ApiEnvelope } from "./request";

export async function hasForeignSession(paths: string[]): Promise<boolean> {
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        const response = await axios.get<ApiEnvelope<AuthPayload>>(path, {
          timeout: 5_000,
          withCredentials: true,
        });
        return response.status === 200 && Boolean(response.data.data.user);
      } catch {
        return false;
      }
    }),
  );
  return results.some(Boolean);
}
