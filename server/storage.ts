import { prisma } from './db';
import bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

type Role = 'ADMIN' | 'MEMBER';

interface Membership {
  teamId: string;
  role: Role;
}

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  role: Role;
  avatar?: string | null;
  password: string;
  memberships?: Membership[];
  createdAt?: Date;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export class Storage {
  // User methods
  async getUser(id: string): Promise<(User & { memberships: Membership[] }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        memberships: true
      }
    });
  }

  async getUserByEmail(email: string): Promise<(User & { memberships: Membership[] }) | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        memberships: true
      }
    });
  }

  async createUser(data: { email: string, password: string, name?: string, role?: Role }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'MEMBER'
      }
    });
  }

  // Team methods
  async createTeam(data: { name: string, ownerId: string }): Promise<Team & { members: Membership[] }> {
    return prisma.team.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        members: {
          create: {
            userId: data.ownerId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: true
      }
    });
  }

  async getTeamMembers(teamId: string) {
    return prisma.membership.findMany({
      where: { teamId },
      include: {
        user: true
      }
    });
  }

  async createMembership(data: { userId: string, teamId: string, role: Role }): Promise<Membership & { user: User, team: Team }> {
    // First check if membership already exists
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_teamId: {
          userId: data.userId,
          teamId: data.teamId
        }
      }
    });

    if (existingMembership) {
      throw new Error('User is already a member of this team');
    }

    return prisma.membership.create({
      data: {
        userId: data.userId,
        teamId: data.teamId,
        role: data.role
      },
      include: {
        user: true,
        team: true
      }
    });
  }

  // Invitation methods
  async createInvitation(data: {
    email: string,
    teamId: string,
    inviterId: string,
    role?: Role,
    token?: string,
    expiresAt: Date
  }) {
    return prisma.invitation.create({
      data: {
        email: data.email,
        teamId: data.teamId,
        inviterId: data.inviterId,
        role: data.role || 'MEMBER',
        token: data.token || crypto.randomBytes(32).toString('hex'),
        expiresAt: data.expiresAt
      }
    });
  }

  async getInvitationByToken(token: string) {
    return prisma.invitation.findUnique({
      where: { token }
    });
  }

  async deleteInvitation(id: string) {
    await prisma.invitation.delete({
      where: { id }
    });
    return true;
  }
}
