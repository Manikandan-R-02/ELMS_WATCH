import { GENERIC_ERROR, NETWORK_ERROR, TIMEOUT_ERROR, safeMessage } from "../lib/safeMessage";

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** An error ready to show: `message` never carries server, database or HTTP internals (see `safeMessage`). */
export function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosErr = error as unknown as {
      response?: { data?: { message?: string }; status?: number };
      code?: string;
      message: string;
    };
    const status = axiosErr.response?.status;
    let message: string;
    if (!axiosErr.response) {
      message = axiosErr.code === "ECONNABORTED" || /timeout/i.test(axiosErr.message ?? "") ? TIMEOUT_ERROR : NETWORK_ERROR;
    } else if (status !== undefined && status >= 500) {
      message = GENERIC_ERROR;
    } else {
      message = safeMessage(axiosErr.response.data?.message);
    }
    return { message, status, details: axiosErr.response?.data };
  }
  return { message: safeMessage(error instanceof Error ? error.message : undefined) };
}
