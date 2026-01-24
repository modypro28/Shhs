import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const songRequests = pgTable("song_requests", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  query: text("query").notNull(),
  status: text("status").default("pending"), // pending, playing, completed, failed
  requestedAt: timestamp("requested_at").defaultNow(),
  isGroup: boolean("is_group").default(false),
  groupName: text("group_name"),
});

export const insertSongRequestSchema = createInsertSchema(songRequests).omit({ 
  id: true, 
  requestedAt: true 
});

export type InsertSongRequest = z.infer<typeof insertSongRequestSchema>;
export type SongRequest = typeof songRequests.$inferSelect;

export const botSessions = pgTable("bot_sessions", {
  id: text("id").primaryKey(),
  creds: text("creds").notNull(), // Store Auth credentials securely
});

export const connectedUsers = pgTable("connected_users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  pairingCode: text("pairing_code"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, pairing
  lastConnected: timestamp("last_connected"),
});

export const insertConnectedUserSchema = createInsertSchema(connectedUsers).omit({
  id: true,
  lastConnected: true,
});

export type ConnectedUser = typeof connectedUsers.$inferSelect;
export type InsertConnectedUser = z.infer<typeof insertConnectedUserSchema>;
