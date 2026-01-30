import { db } from "./db";
import {
  songRequests,
  type InsertSongRequest,
  type SongRequest,
  connectedUsers,
  type InsertConnectedUser,
  type ConnectedUser,
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Fixes applied:
 * - imported connectedUsers & related types
 * - imported eq from drizzle-orm used in queries
 * - ensured functions return correct typed values
 */

export interface IStorage {
  createRequest(request: InsertSongRequest): Promise<SongRequest>;
  getRequests(limit?: number): Promise<SongRequest[]>;
  upsertUser(user: InsertConnectedUser): Promise<ConnectedUser>;
  getUsers(): Promise<ConnectedUser[]>;
}

export class DatabaseStorage implements IStorage {
  async createRequest(request: InsertSongRequest): Promise<SongRequest> {
    const [newRequest] = await db.insert(songRequests).values(request).returning();
    return newRequest;
  }

  async getRequests(limit = 50): Promise<SongRequest[]> {
    return await db
      .select()
      .from(songRequests)
      .orderBy(desc(songRequests.requestedAt))
      .limit(limit);
  }

  async upsertUser(user: InsertConnectedUser): Promise<ConnectedUser> {
    const [existing] = await db
      .select()
      .from(connectedUsers)
      .where(eq(connectedUsers.phoneNumber, user.phoneNumber));

    if (existing) {
      const [updated] = await db
        .update(connectedUsers)
        .set({ ...user, lastConnected: new Date() })
        .where(eq(connectedUsers.phoneNumber, user.phoneNumber))
        .returning();
      return updated;
    }

    const [newUser] = await db
      .insert(connectedUsers)
      .values({ ...user, lastConnected: new Date() })
      .returning();
    return newUser;
  }

  async getUsers(): Promise<ConnectedUser[]> {
    return await db.select().from(connectedUsers).orderBy(desc(connectedUsers.lastConnected));
  }
}

export const storage = new DatabaseStorage();