import express, { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Storage } from "./storage";
import { registerSchema, loginSchema, insertTaskSchema, updateTaskSchema } from "../shared/schema";
import crypto from "crypto";
import { Resend } from 'resend';
import { PrismaClient, Prisma } from '@prisma/client';

type Role = 'ADMIN' | 'MEMBER';

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  password: string;
  role: Role;
  createdAt: Date;
}

interface Membership {
  id: string;
  userId: string;
  teamId: string;
  role: Role;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

interface AuthRequest extends Request {
  user?: UserWithMemberships;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: Date | null;
  assigneeId: number | null;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
}

const storage = new Storage();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const resend = new Resend('re_fdRLUHFW_7fJVwdHG7HRWhGtjxofro3Kr');
const prisma = new PrismaClient();

const authenticateToken = async (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await storage.getUser(payload.id);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Only allow admin users to access a route
const isAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser(userData);
      
      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }

      // Create a new team for the user
      const team = await storage.createTeam({
        name: `${user.name || 'My'} Team`,
        ownerId: user.id
      });
      
      if (!team) {
        return res.status(500).json({ message: "Failed to create team" });
      }

      // No need to create membership separately as it's created with the team
      const userWithMemberships: UserWithMemberships = {
        ...user,
        memberships: team.members
      };

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password, ...userWithoutPassword } = userWithMemberships;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user!;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User profile routes
  app.patch("/api/users/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { firstName, lastName, currentPassword, newPassword } = req.body;
      const user = req.user!;

      // If changing password, verify current password
      if (currentPassword && newPassword) {
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      // Update user data
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          password: newPassword ? await bcrypt.hash(newPassword, 10) : undefined,
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team routes
  app.get("/api/team/members", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const memberships = user.memberships;
      
      if (!memberships || memberships.length === 0) {
        return res.status(404).json({ message: "No team found" });
      }
      
      // Get the first team's members (we can enhance this later to support multiple teams)
      const teamMembers = await storage.getTeamMembers(memberships[0].teamId);
      res.json(teamMembers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // New endpoints for managing multiple teams
  app.get("/api/teams", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        }
      });
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const { name } = req.body;

      if (user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Only admins can create teams" });
      }

      const team = await prisma.team.create({
        data: {
          name,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/teams/:teamId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const teamId = req.params.teamId;

      // Check if user is admin of the team
      const membership = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          teamId: teamId,
          role: 'ADMIN'
        }
      });

      if (!membership) {
        return res.status(403).json({ message: "Only team admins can delete teams" });
      }

      // Delete team and all related data
      await prisma.team.delete({
        where: {
          id: teamId
        }
      });

      res.json({ message: "Team deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team/invite", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email } = req.body;
      const user = req.user!;
      
      // Check if user has admin role in any team
      const adminMembership = user.memberships.find((m: { role: Role }) => m.role === 'ADMIN');
      if (!adminMembership) {
        return res.status(403).json({ message: "Only team admins can send invitations" });
      }

      // Create invitation
      const token = crypto.randomBytes(32).toString('hex');
      const invitation = await storage.createInvitation({
        email,
        teamId: adminMembership.teamId,
        inviterId: user.id,
        token,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });

      // Send invitation email if Resend is configured
      try {
        await resend.emails.send({
          from: 'muheez@innofyai.com',
          to: email,
          subject: 'Invitation to join InnoFy AI Team',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #6366f1; margin-bottom: 20px;">You've been invited!</h1>
              <p style="font-size: 16px; line-height: 1.5; color: #4b5563; margin-bottom: 20px;">
                You've been invited to join the team on InnoFy AI. Click the button below to accept the invitation and get started.
              </p>
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}" 
                 style="display: inline-block; background: linear-gradient(to right, #6366f1, #8b5cf6); 
                        color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                        font-weight: bold;">
                Accept Invitation
              </a>
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue with invitation creation even if email fails
      }

      res.json({ message: "Invitation sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team/accept-invite", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Create user if they don't exist
      let userWithMemberships = await storage.getUserByEmail(invitation.email);
      
      if (!userWithMemberships) {
        const newUser = await storage.createUser({
          email: invitation.email,
          password
        });

        if (!newUser) {
          return res.status(500).json({ message: "Failed to create user" });
        }

        // Create membership for the new user
        const membership = await storage.createMembership({
          userId: newUser.id,
          teamId: invitation.teamId,
          role: invitation.role || 'MEMBER'
        });

        if (!membership) {
          return res.status(500).json({ message: "Failed to create team membership" });
        }

        userWithMemberships = {
          ...newUser,
          memberships: [membership]
        };
      } else {
        // Add membership for existing user
        const membership = await storage.createMembership({
          userId: userWithMemberships.id,
          teamId: invitation.teamId,
          role: invitation.role || 'MEMBER'
        });

        if (!membership) {
          return res.status(500).json({ message: "Failed to create team membership" });
        }

        userWithMemberships.memberships.push(membership);
      }

      // Delete the invitation
      await storage.deleteInvitation(invitation.id);

      // Generate auth token
      const authToken = jwt.sign(
        { id: userWithMemberships.id, email: userWithMemberships.email, role: userWithMemberships.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = userWithMemberships;
      res.json({ user: userWithoutPassword, token: authToken });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Task routes
  app.post("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const user = req.user!;

      const task = await prisma.task.create({
        data: {
          ...validatedData,
          creatorId: user.id,
          assigneeId: validatedData.assigneeId || null,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
        },
        include: {
          creator: true,
          assignee: true
        }
      });

      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            { assigneeId: user.id }
          ]
        },
        include: {
          creator: true,
          assignee: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const validatedData = updateTaskSchema.parse(req.body);
      const user = req.user!;

      // Check if task exists and user has permission
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (existingTask.creatorId !== user.id && existingTask.assigneeId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          assigneeId: validatedData.assigneeId || undefined
        },
        include: {
          creator: true,
          assignee: true
        }
      });

      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Task stats route
  app.get("/api/tasks/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const userId = parseInt(user.id);
      
      // Get all tasks for the user's teams
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: userId },
            { creatorId: userId }
          ]
        }
      });

      // Calculate stats
      const stats = {
        total: tasks.length,
        todo: tasks.filter((task: Task) => task.status === 'TODO').length,
        inProgress: tasks.filter((task: Task) => task.status === 'IN_PROGRESS').length,
        completed: tasks.filter((task: Task) => task.status === 'DONE').length,
        overdue: tasks.filter((task: Task) => {
          if (!task.dueDate || task.status === 'DONE') return false;
          return new Date(task.dueDate) < new Date();
        }).length,
        assignedToMe: tasks.filter((task: Task) => task.assigneeId === userId).length,
        createdByMe: tasks.filter((task: Task) => task.creatorId === userId).length,
        completionRate: tasks.length > 0 
          ? Math.round((tasks.filter((task: Task) => task.status === 'DONE').length / tasks.length) * 100)
          : 0
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invitations routes
  app.post("/api/invitations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email, role } = req.body;
      const user = req.user!;
      
      // Check if user has admin role in any team
      const adminMembership = user.memberships.find(m => m.role === 'ADMIN');
      if (!adminMembership) {
        return res.status(403).json({ message: "Only team admins can send invitations" });
      }

      // Create invitation token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Create invitation in database
      const invitation = await prisma.invitation.create({
        data: {
          email,
          role: role.toUpperCase() as Role,
          token,
          teamId: adminMembership.teamId,
          inviterId: user.id,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        }
      });

      // Send invitation email if Resend is configured
      try {
        await resend.emails.send({
          from: 'muheez@innofyai.com',
          to: email,
          subject: 'Invitation to join InnoFy AI Team',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #6366f1; margin-bottom: 20px;">You've been invited!</h1>
              <p style="font-size: 16px; line-height: 1.5; color: #4b5563; margin-bottom: 20px;">
                You've been invited to join the team on InnoFy AI. Click the button below to accept the invitation and get started.
              </p>
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}" 
                 style="display: inline-block; background: linear-gradient(to right, #6366f1, #8b5cf6); 
                        color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                        font-weight: bold;">
                Accept Invitation
              </a>
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue with invitation creation even if email fails
      }

      // Return success with invite link
      res.json({ 
        message: "Invitation sent successfully",
        inviteLink: `/accept-invite?token=${token}`
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invitations/pending", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Check if user has admin role in any team
      const adminMembership = user.memberships.find(m => m.role === 'ADMIN');
      if (!adminMembership) {
        return res.status(403).json({ message: "Only team admins can view invitations" });
      }

      // Get pending invitations for the team
      const invitations = await prisma.invitation.findMany({
        where: {
          teamId: adminMembership.teamId,
          expiresAt: {
            gt: new Date() // Not expired
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invitations/accept", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Find and validate invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token }
      });

      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: invitation.email }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: invitation.email,
            password: await bcrypt.hash(password, 10),
            role: invitation.role
          }
        });
      }

      // Create team membership
      await prisma.membership.create({
        data: {
          userId: user.id,
          teamId: invitation.teamId,
          role: invitation.role
        }
      });

      // Delete the invitation
      await prisma.invitation.delete({
        where: { id: invitation.id }
      });

      // Generate auth token
      const authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        message: "Invitation accepted successfully",
        token: authToken
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
