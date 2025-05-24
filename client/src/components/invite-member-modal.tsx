import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onInviteSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/invitations", {
        email,
        role,
      });
      
      const data = response.data;
      setInviteLink(`${window.location.origin}${data.inviteLink}`);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${email} 📨`,
      });
      
      onInviteSent();
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setRole("member");
    setInviteLink("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Copied",
        description: "Invitation link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new team member.
          </DialogDescription>
        </DialogHeader>
        
        {inviteLink ? (
          <div className="py-6">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Invitation Sent!</h3>
              <p className="text-sm text-gray-500">
                Your invitation has been sent to {email}
              </p>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="invite-link">Invitation Link</Label>
              <div className="mt-1.5 flex">
                <Input
                  id="invite-link"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                You can also share this link directly with your team member. It expires in 72 hours.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleClose}>Close</Button>
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => {
                  resetForm();
                  setInviteLink("");
                }}
              >
                Send Another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={setRole}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Admins can manage team members and settings, while members can only manage tasks.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 