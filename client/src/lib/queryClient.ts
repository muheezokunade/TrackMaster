import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "https://trackmaster-cb3k.onrender.com";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export const apiRequest = async (method: string, endpoint: string, data?: any) => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : "",
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
      withCredentials: true,
    });
    
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error("Connection timeout. Please try again.");
      }
      if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }
      if (error.response.status === 404) {
        throw new Error("The requested resource was not found.");
      }
      if (error.response.status === 403) {
        throw new Error("You don't have permission to access this resource.");
      }
      if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: 'include',
        mode: 'cors',
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
