import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.clear();
    setLocation("/login");
  };

  return {
    user,
    isLoading,
    logout,
  };
}
