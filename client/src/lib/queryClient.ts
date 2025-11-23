import { QueryClient } from "@tanstack/react-query";

async function handleRequest(
  method: string,
  url: string,
  data?: any
): Promise<any> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any
): Promise<T> {
  return handleRequest(method, url, data);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = Array.isArray(queryKey)
          ? queryKey.filter((key) => typeof key === "string").join("/")
          : queryKey;
        return handleRequest("GET", url as string);
      },
      staleTime: 1000 * 60,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
