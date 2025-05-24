import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskModal } from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { 
  Menu, 
  Sun, 
  Moon
} from "lucide-react";

export default function Kanban() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { theme, toggleTheme } = useTheme();

  // Listen for task modal events from kanban board
  useEffect(() => {
    const handleOpenTaskModal = () => setTaskModalOpen(true);
    window.addEventListener('openTaskModal', handleOpenTaskModal);
    return () => window.removeEventListener('openTaskModal', handleOpenTaskModal);
  }, []);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-purple-900 dark:to-indigo-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 glassmorphism flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Kanban Board
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organize tasks with drag-and-drop
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="p-6">
          <KanbanBoard tasks={tasks || []} isLoading={tasksLoading} />
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        users={users}
      />
    </div>
  );
}