import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { 
  Menu, 
  Sun, 
  Moon,
  Users,
  UserPlus,
  Plus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteMemberModal } from "@/components/invite-member-modal";
import { TaskModal } from "@/components/task-modal";
import { PendingInvitations } from "@/components/pending-invitations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Team() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for task modal events
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

  const handleInviteSent = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invitations/pending"] });
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
            {user.role === 'admin' && (
              <Button
                onClick={() => setIsAddingMember(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Members List */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="members" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-6">
                  <TabsTrigger value="members">Team Members</TabsTrigger>
                  {user.role === 'admin' && (
                    <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="members" className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {users.map((member: any) => {
                      const stats = getUserStats(member.id);
                      return (
                        <Card key={member.id} className="glassmorphism hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-semibold">
                                      {member.firstName} {member.lastName}
                                    </h3>
                                    <Badge className={getRoleColor(member.role)}>
                                      {member.role}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">@{member.username}</p>
                                  <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-500">Assigned Tasks</p>
                                <p className="text-2xl font-semibold">{stats.assigned}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-semibold">{stats.completed}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

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
                          {user.role === 'admin' && (
                            <Button 
                              className="mt-4"
                              onClick={() => setIsAddingMember(true)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                {user.role === 'admin' && (
                  <TabsContent value="invitations">
                    <PendingInvitations />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.role === 'admin' && (
                    <Button
                      className="w-full justify-start"
                      onClick={() => setIsAddingMember(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Team Member
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.dispatchEvent(new Event('openTaskModal'))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                </CardContent>
              </Card>

              {/* Team Stats */}
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Team Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Members</p>
                      <p className="text-2xl font-semibold">{users.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Tasks</p>
                      <p className="text-2xl font-semibold">{tasks?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <InviteMemberModal 
        isOpen={isAddingMember} 
        onClose={() => setIsAddingMember(false)}
        onInviteSent={handleInviteSent}
      />

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        users={users}
      />
    </div>
  );
}