import { db } from "./db";
import { songRequests, type InsertSongRequest, type SongRequest } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  createRequest(request: InsertSongRequest): Promise<SongRequest>;
  getRequests(limit?: number): Promise<SongRequest[]>;
}

export class DatabaseStorage implements IStorage {
  async createRequest(request: InsertSongRequest): Promise<SongRequest> {
    const [newRequest] = await db
      .insert(songRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getRequests(limit = 50): Promise<SongRequest[]> {
    return await db
      .select()
      .from(songRequests)
      .orderBy(desc(songRequests.requestedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
