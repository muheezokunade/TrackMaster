import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { 
  Menu, 
  Sun, 
  Moon,
  Users,
  Mail,
  Calendar,
  CheckSquare,
  Clock,
  Award
} from "lucide-react";

export default function Team() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const { theme, toggleTheme } = useTheme();

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  if (!user) return null;

  const getUserStats = (userId: number) => {
    const userTasks = tasks?.filter(task => task.assigneeId === userId || task.creatorId === userId) || [];
    const assignedTasks = tasks?.filter(task => task.assigneeId === userId) || [];
    const createdTasks = tasks?.filter(task => task.creatorId === userId) || [];
    const completedTasks = assignedTasks.filter(task => task.status === 'DONE');
    
    return {
      total: userTasks.length,
      assigned: assignedTasks.length,
      created: createdTasks.length,
      completed: completedTasks.length,
      completionRate: assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0
    };
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-purple-900 dark:to-indigo-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64">
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
                Team
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage team members and track their progress
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

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map((member: any) => {
              const stats = getUserStats(member.id);
              return (
                <Card key={member.id} className="glassmorphism hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-secondary text-white">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </h3>
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {stats.assigned}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {stats.completed}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                      </div>
                    </div>

                    {stats.assigned > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {stats.completionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {stats.completionRate >= 80 && stats.assigned > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                        <Award className="w-4 h-4" />
                        <span>Top Performer!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {users.length === 0 && (
            <Card className="glassmorphism">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No team members yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Invite team members to start collaborating on tasks.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}