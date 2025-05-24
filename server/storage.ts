import { users, tasks, type User, type InsertUser, type Task, type InsertTask, type UpdateTask, type TaskWithUsers } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Task methods
  getTasks(userId?: number): Promise<TaskWithUsers[]>;
  getTask(id: number): Promise<TaskWithUsers | undefined>;
  createTask(task: InsertTask): Promise<TaskWithUsers>;
  updateTask(id: number, updates: UpdateTask): Promise<TaskWithUsers | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(status: string): Promise<TaskWithUsers[]>;
  getTasksByAssignee(assigneeId: number): Promise<TaskWithUsers[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTasks(userId?: number): Promise<TaskWithUsers[]> {
    const query = db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeId: tasks.assigneeId,
        creatorId: tasks.creatorId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.creatorId, users.id))
      .orderBy(desc(tasks.createdAt));

    const result = await query;
    
    // Get assignees separately and merge
    const tasksWithAssignees = await Promise.all(
      result.map(async (task) => {
        let assignee = null;
        if (task.assigneeId) {
          assignee = await this.getUser(task.assigneeId);
        }
        return {
          ...task,
          assignee,
        } as TaskWithUsers;
      })
    );

    return tasksWithAssignees;
  }

  async getTask(id: number): Promise<TaskWithUsers | undefined> {
    const [result] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeId: tasks.assigneeId,
        creatorId: tasks.creatorId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.creatorId, users.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;

    let assignee = null;
    if (result.assigneeId) {
      assignee = await this.getUser(result.assigneeId);
    }

    return {
      ...result,
      assignee,
    } as TaskWithUsers;
  }

  async createTask(task: any): Promise<TaskWithUsers> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    
    const taskWithUsers = await this.getTask(newTask.id);
    if (!taskWithUsers) {
      throw new Error("Failed to retrieve created task");
    }
    
    return taskWithUsers;
  }

  async updateTask(id: number, updates: UpdateTask): Promise<TaskWithUsers | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      dueDate: updates.dueDate ? new Date(updates.dueDate) : updates.dueDate,
    };

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) return undefined;

    return await this.getTask(id);
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getTasksByStatus(status: string): Promise<TaskWithUsers[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.status === status);
  }

  async getTasksByAssignee(assigneeId: number): Promise<TaskWithUsers[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.assigneeId === assigneeId);
  }
}

export const storage = new DatabaseStorage();
