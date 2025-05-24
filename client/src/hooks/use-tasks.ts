import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { TaskWithUsers } from "@shared/schema";

export function useTasks() {
  const { user } = useAuth();

  const query = useQuery<TaskWithUsers[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  return {
    tasks: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
