import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  members: Array<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }>;
}

export function TeamManagement() {
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await apiRequest("POST", "/api/teams", { name: newTeamName });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setNewTeamName("");
      toast({
        title: "Success",
        description: "Team created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/teams/${teamId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleCreateTeam} className="flex gap-2">
          <Input
            placeholder="Enter team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="bg-white/50 dark:bg-gray-800/50"
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-primary to-secondary"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create Team"}
          </Button>
        </form>

        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-gray-200/10"
            >
              <div>
                <h3 className="font-medium">{team.name}</h3>
                <p className="text-sm text-gray-500">
                  {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteTeam(team.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 