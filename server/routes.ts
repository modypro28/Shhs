import { storage } from "./storage";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, type WASocket, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import pino from "pino"; // Required for baileys logging
import { api } from "@shared/routes";
import { eq } from "drizzle-orm";
import { connectedUsers } from "@shared/schema";

// Global Bot State
let sock: WASocket | undefined;
let qrCode: string | undefined;
let connectionStatus: "connected" | "disconnected" | "connecting" = "disconnected";
let activeTimers: Map<string, NodeJS.Timeout> = new Map();

// Helper to start the bot
async function startBot(usePairingCode?: string) {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version } = await fetchLatestBaileysVersion();

  connectionStatus = "connecting";
  qrCode = undefined;

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }) as any,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  });

  if (usePairingCode && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock?.requestPairingCode(usePairingCode);
        console.log(`Pairing code for ${usePairingCode}: ${code}`);
        // We'll return this code via API
      } catch (e) {
        console.error("Failed to request pairing code", e);
      }
    }, 3000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCode = qr;
      connectionStatus = "connecting";
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      connectionStatus = "disconnected";
      qrCode = undefined;
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      connectionStatus = "connected";
      qrCode = undefined;
      if (sock?.user) {
        await storage.upsertUser({
          phoneNumber: sock.user.id.split(":")[0],
          status: "connected",
        });
      }
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const remoteJid = msg.key.remoteJid;

    if (!remoteJid) return;

    // .pair command for the bot itself
    if (text.startsWith(".pair")) {
      await sock?.sendMessage(remoteJid, { text: "🔗 To pair another device, please visit our website dashboard." });
      return;
    }

    if (text.startsWith(".play") || text.startsWith(".شغل") || text.startsWith(".تحميل")) {
      // Existing play logic...
    }
  });
}

// Start bot initially
startBot().catch(err => console.error("Failed to start bot", err));

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.post(api.bot.pair.path, async (req, res) => {
    try {
      const { phoneNumber } = api.bot.pair.input.parse(req.body);
      // Clean phone number: remove +, space, etc.
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      
      // Stop current session if exists to initiate pairing
      if (sock) {
        await sock.end(undefined);
      }
      
      // We need a way to return the code. 
      // For simplicity, we restart the bot in pairing mode.
      // In a real app, you'd handle multiple sockets.
      const { state } = await useMultiFileAuthState("auth_info_baileys");
      const tempSock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }) as any,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
      });

      const code = await tempSock.requestPairingCode(cleanNumber);
      res.json({ code });
      
      // Don't await the full connection here, let it happen in background
      startBot(cleanNumber);
    } catch (e) {
      res.status(400).json({ message: "Invalid phone number or pairing error" });
    }
  });

  app.post(api.bot.disconnect.path, async (req, res) => {
    try {
        await sock?.logout();
        await sock?.end(undefined);
        connectionStatus = "disconnected";
        qrCode = undefined;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.requests.list.path, async (req, res) => {
    const requests = await storage.getRequests();
    res.json(requests);
  });

  return httpServer;
}
