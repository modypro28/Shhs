import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type SongRequest } from "@shared/schema";

export function useBotStatus() {
  return useQuery({
    queryKey: [api.bot.status.path],
    queryFn: async () => {
      const res = await fetch(api.bot.status.path);
      if (!res.ok) throw new Error("Failed to fetch bot status");
      return api.bot.status.responses[200].parse(await res.json());
    },
    refetchInterval: 3000, // Poll every 3 seconds for QR updates/status changes
  });
}

export function useConnectBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.bot.connect.path, {
        method: api.bot.connect.method,
      });
      if (!res.ok) throw new Error("Failed to initiate connection");
      return api.bot.connect.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
    },
  });
}

export function useDisconnectBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.bot.disconnect.path, {
        method: api.bot.disconnect.method,
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return api.bot.disconnect.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
    },
  });
}

export function useSongRequests() {
  return useQuery({
    queryKey: [api.requests.list.path],
    queryFn: async () => {
      const res = await fetch(api.requests.list.path);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Keep list fresh
  });
}
