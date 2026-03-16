import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDisconnectClient, useGetSyncState } from "@/hooks/useQueries";
import {
  ArrowLeft,
  Globe,
  PlugZap,
  RefreshCw,
  Unplug,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ClientPageProps {
  sessionId: string;
  clientId: bigint;
  onBack: () => void;
}

export function ClientPage({ sessionId, clientId, onBack }: ClientPageProps) {
  const [synced, setSynced] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const prevSyncUrl = useRef("");

  const disconnectClient = useDisconnectClient();
  const { data: syncState } = useGetSyncState(sessionId, synced);

  const loadUrl = useCallback((url: string) => {
    setIframeSrc(url);
    setIframeBlocked(false);
    setIframeKey((k) => k + 1);
    setUrlInput(url);
  }, []);

  useEffect(() => {
    if (!synced || !syncState) return;
    const { master } = syncState;
    if (
      master.syncEnabled &&
      master.url &&
      master.url !== prevSyncUrl.current
    ) {
      prevSyncUrl.current = master.url;
      loadUrl(master.url);
      toast.info("Master ne naya URL bheja");
    }
  }, [syncState, synced, loadUrl]);

  const handleGo = () => {
    let u = urlInput.trim();
    if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
      u = `https://${u}`;
    }
    if (!u) return;
    loadUrl(u);
  };

  const handleDisconnect = async () => {
    setSynced(false);
    try {
      await disconnectClient.mutateAsync({ sessionId, clientId });
    } catch {
      // best-effort
    }
    toast.info("Disconnected from sync — manual mode active");
  };

  const handleReconnect = () => {
    setSynced(true);
    prevSyncUrl.current = "";
    toast.success("Reconnected to sync");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div
          data-ocid="client.session_info"
          className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border"
        >
          <span className="text-xs text-muted-foreground">Session:</span>
          <code className="text-xs text-accent font-mono font-medium">
            {sessionId.slice(0, 12)}...
          </code>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            Slot #{Number(clientId) + 1}
          </span>
        </div>

        <div
          data-ocid="client.sync_status"
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${
            synced
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-secondary/50 text-muted-foreground border-border"
          }`}
        >
          {synced ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {synced ? "Synced" : "Manual"}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {synced ? (
            <Button
              data-ocid="client.disconnect_button"
              onClick={handleDisconnect}
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-7 px-3"
            >
              <Unplug className="w-3 h-3 mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button
              data-ocid="client.reconnect_button"
              onClick={handleReconnect}
              size="sm"
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-7 px-3"
            >
              <PlugZap className="w-3 h-3 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/40 flex-shrink-0"
      >
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Input
          data-ocid="client.url_input"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          placeholder="Koi bhi URL daalo..."
          className="flex-1 h-8 text-sm bg-input border-border font-mono"
        />
        <Button
          data-ocid="client.go_button"
          onClick={handleGo}
          size="sm"
          className="bg-accent/10 hover:bg-accent/20 text-accent border border-accent/40 px-4"
          variant="outline"
        >
          Go
        </Button>
      </motion.div>

      {synced && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/10 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary/80">
            Master ko follow kar raha hai
          </span>
          {syncState?.master.syncEnabled === false && (
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground border-border ml-auto"
            >
              Master sync paused
            </Badge>
          )}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {!iframeSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">
              {synced
                ? "Master ke URL ka intezaar hai..."
                : "URL daalo aur Go dabao"}
            </p>
          </div>
        )}

        {iframeSrc && !iframeBlocked && (
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            onLoad={() => setIframeBlocked(false)}
            onError={() => setIframeBlocked(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Web Viewer"
            data-ocid="client.canvas_target"
          />
        )}

        {iframeSrc && iframeBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Yeh website app mein nahi khulti
              </p>
              <p className="text-xs text-muted-foreground">
                Kuch websites apni security policy se viewer block karti hain.
                Koi doosri URL try karo.
              </p>
            </div>
            <Button
              data-ocid="client.secondary_button"
              onClick={() => {
                setIframeSrc("");
                setIframeBlocked(false);
              }}
              size="sm"
              variant="ghost"
              className="text-muted-foreground text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Dusri URL try karo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
