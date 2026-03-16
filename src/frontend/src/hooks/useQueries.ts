import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useCreateSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.createSession();
    },
  });
}

export function useJoinSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.joinSession(sessionId);
    },
  });
}

export function useUpdateSyncState() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      url,
      position,
      syncEnabled,
    }: {
      sessionId: string;
      url: string;
      position: { x: number; y: number };
      syncEnabled: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateSyncState(sessionId, url, position, syncEnabled);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["syncState", vars.sessionId] });
    },
  });
}

export function useGetSyncState(sessionId: string, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["syncState", sessionId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSyncState(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId && enabled,
    refetchInterval: enabled ? 1500 : false,
  });
}

export function useGetClientCount(sessionId: string, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["clientCount", sessionId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getClientCount(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId && enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

export function useDisconnectClient() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      sessionId,
      clientId,
    }: {
      sessionId: string;
      clientId: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.disconnectClient(sessionId, clientId);
    },
  });
}
