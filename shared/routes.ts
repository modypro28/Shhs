import { z } from "zod";
import { songRequests } from "./schema";

export const api = {
  bot: {
    status: {
      method: "GET",
      path: "/api/bot/status",
      responses: {
        200: z.object({
          status: z.enum(["connected", "disconnected", "connecting"]),
          qrCode: z.string().optional(), // Base64 QR code if connecting
          phoneNumber: z.string().optional(),
        }),
      },
    },
    connect: {
      method: "POST",
      path: "/api/bot/connect",
      input: z.object({}),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    disconnect: {
      method: "POST",
      path: "/api/bot/disconnect",
      input: z.object({}),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  requests: {
    list: {
      method: "GET",
      path: "/api/requests",
      responses: {
        200: z.array(z.custom<typeof songRequests.$inferSelect>()),
      },
    },
  },
};
