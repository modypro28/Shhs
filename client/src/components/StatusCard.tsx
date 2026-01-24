import { QRCodeSVG } from "qrcode.react";
import { Loader2, Smartphone, Power, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBotStatus, useConnectBot, useDisconnectBot } from "@/hooks/use-bot";

export function StatusCard() {
  const { data: status, isLoading } = useBotStatus();
  const connectMutation = useConnectBot();
  const disconnectMutation = useDisconnectBot();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isConnected = status?.status === "connected";
  const isConnecting = status?.status === "connecting";

  return (
    <div className="glass-panel rounded-3xl overflow-hidden relative group">
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-1000" />

      <div className="p-8 relative z-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto transition-all duration-500
            ${isConnected ? 'bg-primary/20 text-primary shadow-primary/20' : 'bg-muted/30 text-muted-foreground'}
          `}>
            <Smartphone className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 font-display">
            Bot Status <span className="font-arabic opacity-70 ml-2">(حالة البوت)</span>
          </h2>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 border border-white/5 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {status?.status || "Unknown"}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isConnected && (
            <motion.div
              key="qr-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-4 rounded-xl shadow-xl mb-8"
            >
              {status?.qrCode ? (
                <div className="space-y-4">
                  <QRCodeSVG value={status.qrCode} size={200} />
                  <p className="text-xs text-black/60 font-medium">Scan with WhatsApp</p>
                </div>
              ) : (
                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-gray-100 rounded-lg text-gray-400 gap-2">
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-xs">Generating QR...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-8 h-8" />
                      <span className="text-xs">Click Start to Connect</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 w-full">
          {!isConnected ? (
            <button
              onClick={() => connectMutation.mutate()}
              disabled={isConnecting || connectMutation.isPending}
              className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isConnecting ? "Connecting..." : "Start Bot"}
            </button>
          ) : (
            <div className="w-full space-y-4">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-primary-foreground/80">Connected as</p>
                <p className="text-lg font-mono font-bold text-primary">{status?.phoneNumber}</p>
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="w-full py-4 rounded-xl bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-all border border-destructive/20 flex items-center justify-center gap-2"
              >
                <Power className="w-5 h-5" />
                Stop Bot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
