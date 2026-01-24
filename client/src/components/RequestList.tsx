import { useSongRequests } from "@/hooks/use-bot";
import { formatDistanceToNow } from "date-fns";
import { Music, Clock, Users, User, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function RequestList() {
  const { data: requests, isLoading } = useSongRequests();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-display flex items-center gap-2">
          Recent Requests <span className="text-muted-foreground text-sm font-arabic font-normal">(الطلبات الأخيرة)</span>
        </h3>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          Total: {requests?.length || 0}
        </span>
      </div>

      <div className="grid gap-3">
        {requests?.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
            <Music className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No song requests yet</p>
          </div>
        ) : (
          requests?.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`
                    mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${req.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                      req.status === 'playing' ? 'bg-primary/10 text-primary' : 
                      req.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'}
                  `}>
                    <Music className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground line-clamp-1">{req.query}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        {req.isGroup ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {req.isGroup ? (req.groupName || "Group") : "Direct"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {req.requestedAt && formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={req.status || 'pending'} />
                  <span className="text-[10px] font-mono opacity-40">{req.phoneNumber}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    playing: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const icons = {
    pending: <Clock className="w-3 h-3" />,
    playing: <Loader2 className="w-3 h-3 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
  };

  return (
    <span className={`
      px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 capitalize
      ${styles[status as keyof typeof styles] || styles.pending}
    `}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  );
}
