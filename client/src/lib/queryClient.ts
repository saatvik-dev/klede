import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMessage = `${res.status}: ${text}`;
    console.error("API Error:", errorMessage, "URL:", res.url);
    throw new Error(errorMessage);
  }
}

/**
 * Helper function to get the correct API URL for both development and production
 * In development, API calls go directly to the path
 * In production on Netlify, API calls go to /.netlify/functions/api-standalone
 */
function getApiUrl(path: string): string {
  // Make sure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If running in a browser and we're in production
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const baseUrl = window.location.origin;
    
    // For API paths, remap to Netlify Functions path
    if (normalizedPath.startsWith('/api/')) {
      console.log(`Redirecting ${normalizedPath} to Netlify function`);
      // Change /api/something to /.netlify/functions/api-standalone/something
      return `${baseUrl}/.netlify/functions/api-standalone${normalizedPath.substring(4)}`;
    }
    
    // For non-API paths, just use the normal URL
    return `${baseUrl}${normalizedPath}`;
  }
  
  console.log(`Using direct path for development: ${normalizedPath}`);
  // In development mode, just use the path directly
  return normalizedPath;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiUrl(url);
  
  console.log(`Making ${method} request to: ${apiUrl}`);
  if (data) {
    console.log("Request data:", data);
  }
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`Response status: ${res.status}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get appropriate URL for the environment
    const apiUrl = getApiUrl(queryKey[0] as string);
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
