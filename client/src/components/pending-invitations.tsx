import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, RefreshCw, X, Clock } from "lucide-react";

export function PendingInvitations() {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isResending, setIsResending] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: invitations = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/invitations/pending"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  const handleResend = async (id: number) => {
    setIsResending(id);
    try {
      await apiRequest("POST", `/api/invitations/${id}/resend`, {});
      
      toast({
        title: "Success",
        description: "Invitation has been resent",
      });
      
      // Refresh the invitations list
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/pending"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setIsResending(null);
    }
  };
  
  const handleDelete = async (id: number) => {
    setConfirmDelete(null);
    setIsDeleting(id);
    try {
      await apiRequest("DELETE", `/api/invitations/${id}`, {});
      
      toast({
        title: "Success",
        description: "Invitation has been revoked",
      });
      
      // Refresh the invitations list
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/pending"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" style={{ width: '60%' }} />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" style={{ width: '40%' }} />
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            Failed to load invitations. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Invitations</span>
            {invitations.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {invitations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No pending invitations</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                When you invite team members, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium">{invitation.email}</span>
                      <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {invitation.role}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        {' · '}
                        Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResend(invitation.id)}
                      disabled={isResending === invitation.id}
                      className="flex items-center text-gray-500 hover:text-blue-600"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isResending === invitation.id ? 'animate-spin' : ''}`} />
                      <span>Resend</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(invitation.id)}
                      disabled={isDeleting === invitation.id}
                      className="flex items-center text-gray-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span>Revoke</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invitation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete !== null && handleDelete(confirmDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 