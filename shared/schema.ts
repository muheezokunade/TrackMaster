import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const taskStatusEnum = pgEnum("task_status", ["TODO", "IN_PROGRESS", "DONE"]);
export const taskPriorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatar: text("avatar"),
  role: text("role").default("member")
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  email: text("email").notNull(),
  role: text("role").default("member"),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  token: text("token"),
  inviterId: integer("inviter_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  accepted: boolean("accepted").default(false)
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("TODO"),
  priority: text("priority").default("MEDIUM"),
  dueDate: timestamp("due_date"),
  assigneeId: integer("assignee_id").references(() => users.id),
  creatorId: integer("creator_id").references(() => users.id).notNull()
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  name: text("name").notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull()
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member")
});

export const teamsRelations = relations(teams, ({ one, many }: { one: any, many: any }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id]
  }),
  members: many(teamMembers),
  invitations: many(invitations)
}));

export const teamMembersRelations = relations(teamMembers, ({ one }: { one: any }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}));

export const usersRelations = relations(users, ({ many }: { many: any }) => ({
  ownedTeams: many(teams),
  teamMembers: many(teamMembers),
  tasksCreated: many(tasks, { relationName: "creator" }),
  tasksAssigned: many(tasks, { relationName: "assignee" }),
  invitationsSent: many(invitations)
}));

export const tasksRelations = relations(tasks, ({ one }: { one: any }) => ({
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id]
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id]
  })
}));

export const invitationsRelations = relations(invitations, ({ one }: { one: any }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id]
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id]
  })
}));

export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
  role: z.enum(["admin", "member"]).optional(),
  username: z.string(),
  avatar: z.string().optional()
});

export const insertTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional()
});

export const insertTeamSchema = z.object({
  name: z.string(),
  ownerId: z.string()
});

export const insertInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).optional(),
  teamId: z.number(),
  token: z.string().nullable().optional(),
  inviterId: z.number(),
  expiresAt: z.date(),
  accepted: z.boolean().optional()
});

export const updateInvitationSchema = z.object({
  role: z.enum(["admin", "member"]).optional().optional(),
  teamId: z.number().optional(),
  token: z.string().nullable().optional().optional(),
  expiresAt: z.date().optional(),
  accepted: z.boolean().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
}).refine((data: any) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  memberships?: Array<{
    teamId: string;
    role: string;
  }>;
}

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type Task = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  assigneeId: number | null;
  creatorId: number;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type UpdateInvitation = z.infer<typeof updateInvitationSchema>;

export type TaskWithUsers = {
  id: number;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string | null;
  creatorId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  assignee: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

export const signUpSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const taskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  assignedTo: z.string().optional(),
});

export const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
