import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, type WASocket } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import pino from "pino"; // Required for baileys logging
import { api } from "@shared/routes";

// Global Bot State
let sock: WASocket | undefined;
let qrCode: string | undefined;
let connectionStatus: "connected" | "disconnected" | "connecting" = "disconnected";
let activeTimers: Map<string, NodeJS.Timeout> = new Map();

// Helper to start the bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  
  connectionStatus = "connecting";
  qrCode = undefined;

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Useful for logs
    logger: pino({ level: "silent" }) as any, // Suppress verbose logs
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCode = qr;
      connectionStatus = "connecting";
      console.log("QR Code received");
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
      connectionStatus = "disconnected";
      qrCode = undefined;
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("opened connection");
      connectionStatus = "connected";
      qrCode = undefined;
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const messageType = Object.keys(msg.message)[0];
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || "";
    const remoteJid = msg.key.remoteJid;

    if (!remoteJid) return;

    // Commands
    // Support: .play, .شغل, .تحميل
    if (text.startsWith(".play") || text.startsWith(".شغل") || text.startsWith(".تحميل")) {
        const query = text.split(" ").slice(1).join(" ");
        if (!query) {
            await sock?.sendMessage(remoteJid, { text: "⚠️ Please provide a song name. Example: .play Hello" });
            return;
        }

        await storage.createRequest({
            phoneNumber: remoteJid.split("@")[0],
            query: query,
            status: "playing",
            isGroup: remoteJid.endsWith("@g.us"),
            groupName: "Unknown" // Can fetch if needed
        });

        // 1. Send "Searching"
        await sock?.sendMessage(remoteJid, { text: `🔎 Searching for: *${query}*...` });

        // 2. Simulate Finding & Playing (Sending an Image with Timer)
        // We use a placeholder image for album art
        const albumArtUrl = "https://placehold.co/600x600/1a1a1a/FFF?text=Music+Bot"; 
        
        const sentMsg = await sock?.sendMessage(remoteJid, { 
            image: { url: albumArtUrl },
            caption: `🎵 *${query}*\n⏳ 00:00 ------------------ 03:00`
        });

        if (sentMsg && sentMsg.key) {
            // Start Timer Logic
            let seconds = 0;
            const duration = 180; // 3 minutes simulated
            
            // Clear existing timer for this chat if any
            if (activeTimers.has(remoteJid)) {
                clearInterval(activeTimers.get(remoteJid));
            }

            const interval = setInterval(async () => {
                seconds += 10; // Update every 10 seconds logic
                if (seconds > duration) {
                    clearInterval(interval);
                    activeTimers.delete(remoteJid);
                    await sock?.sendMessage(remoteJid, { text: "✅ Finished playing: " + query });
                    return;
                }

                // Format time MM:SS
                const format = (s: number) => {
                    const min = Math.floor(s / 60).toString().padStart(2, '0');
                    const sec = (s % 60).toString().padStart(2, '0');
                    return `${min}:${sec}`;
                };

                const current = format(seconds);
                const total = format(duration);
                const progress = Math.floor((seconds / duration) * 10);
                const bar = "▬".repeat(progress) + "🔘" + "▬".repeat(10 - progress);

                // Edit the message
                // Note: Baileys 'edit' requires the key of the message to edit
                try {
                    await sock?.sendMessage(remoteJid, {
                        edit: sentMsg.key,
                        text: `🎵 *${query}*\n⏳ ${current} ${bar} ${total}`,
                    });
                } catch (e) {
                    console.error("Failed to edit message", e);
                    clearInterval(interval);
                }

            }, 5000); // Update every 5 seconds

            activeTimers.set(remoteJid, interval);
        }
    }
  });
}

// Start bot initially
startBot().catch(err => console.error("Failed to start bot", err));

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // API Routes for Frontend
  app.get(api.bot.status.path, (req, res) => {
    res.json({
        status: connectionStatus,
        qrCode: qrCode,
        phoneNumber: sock?.user?.id ? sock.user.id.split(":")[0] : undefined
    });
  });

  app.post(api.bot.connect.path, async (req, res) => {
    if (connectionStatus === "disconnected") {
        await startBot();
    }
    res.json({ success: true });
  });

  app.post(api.bot.disconnect.path, async (req, res) => {
    try {
        await sock?.logout();
        await sock?.end(undefined);
        connectionStatus = "disconnected";
        qrCode = undefined;
        // Optionally delete auth folder to force full logout
        // fs.rmSync("auth_info_baileys", { recursive: true, force: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
  });

  app.get(api.requests.list.path, async (req, res) => {
    const requests = await storage.getRequests();
    res.json(requests);
  });

  return httpServer;
}
