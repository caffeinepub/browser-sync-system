import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGetClientCount, useUpdateSyncState } from "@/hooks/useQueries";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MasterPageProps {
  sessionId: string;
  onBack: () => void;
}

function normalizeUrl(raw: string): string {
  const u = raw.trim();
  if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
    return `https://${u}`;
  }
  return u;
}

export function MasterPage({ sessionId, onBack }: MasterPageProps) {
  const [urlInput, setUrlInput] = useState("https://wikipedia.org");
  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const currentUrlRef = useRef("");
  const syncEnabledRef = useRef(syncEnabled);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updateSyncState = useUpdateSyncState();
  const { data: clientCount } = useGetClientCount(sessionId, true);

  const pushSync = (url: string, enabled: boolean) => {
    updateSyncState.mutate({
      sessionId,
      url,
      position: { x: 0, y: 0 },
      syncEnabled: enabled,
    });
  };

  const handleGo = () => {
    const url = normalizeUrl(urlInput);
    if (!url) return;
    setIframeSrc(url);
    setIframeBlocked(false);
    setIframeKey((k) => k + 1);
    setUrlInput(url);
    currentUrlRef.current = url;
    // Always push URL to backend so clients can see master's current page
    pushSync(url, syncEnabledRef.current);
  };

  // When iframe navigates to a new page (link click inside iframe),
  // try to detect the new URL and sync it to clients.
  const handleIframeLoad = () => {
    setIframeBlocked(false);
    try {
      const newUrl = iframeRef.current?.contentWindow?.location?.href;
      if (
        newUrl &&
        newUrl !== "about:blank" &&
        newUrl !== currentUrlRef.current
      ) {
        currentUrlRef.current = newUrl;
        setUrlInput(newUrl);
        pushSync(newUrl, syncEnabledRef.current);
        if (syncEnabledRef.current) {
          toast.success("Naya URL clients ko bheja gaya");
        }
      }
    } catch {
      // Cross-origin iframe -- can't read URL, that's ok
    }
  };

  const handleIframeError = () => {
    setIframeBlocked(true);
  };

  const handleSyncToggle = async (val: boolean) => {
    setSyncEnabled(val);
    syncEnabledRef.current = val;
    await updateSyncState.mutateAsync({
      sessionId,
      url: currentUrlRef.current,
      position: { x: 0, y: 0 },
      syncEnabled: val,
    });
    if (val) {
      toast.success(
        currentUrlRef.current
          ? `Sync ON — clients ab "${currentUrlRef.current.slice(0, 40)}" par jayenge`
          : "Sync ON — agla URL clients ko bhi milega",
      );
    } else {
      toast.info("Sync OFF");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    toast.success("Session code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
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

        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border">
          <span className="text-xs text-muted-foreground">Session:</span>
          <code
            data-ocid="master.session_code"
            className="text-xs text-primary font-mono font-medium"
          >
            {sessionId.slice(0, 12)}...
          </code>
          <Button
            data-ocid="master.copy_button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-5 w-5 text-muted-foreground hover:text-primary"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>

        <div
          data-ocid="master.client_count"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Users className="w-3.5 h-3.5" />
          <span>
            {Number(clientCount ?? 0)} client
            {Number(clientCount ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {syncEnabled ? (
              <Wifi className="w-4 h-4 text-primary" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label
              htmlFor="sync-toggle"
              className="text-sm font-medium cursor-pointer"
            >
              Sync
            </Label>
            <Switch
              data-ocid="master.sync_toggle"
              id="sync-toggle"
              checked={syncEnabled}
              onCheckedChange={handleSyncToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          {syncEnabled && (
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </motion.header>

      {/* Address bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/40 flex-shrink-0"
      >
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Input
          data-ocid="master.url_input"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          placeholder="Enter URL (e.g. wikipedia.org)"
          className="flex-1 h-8 text-sm bg-input border-border font-mono"
        />
        <Button
          data-ocid="master.go_button"
          onClick={handleGo}
          size="sm"
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 px-4"
          variant="outline"
        >
          Go
        </Button>
      </motion.div>

      {/* Iframe / Placeholder */}
      <div className="flex-1 relative overflow-hidden">
        {!iframeSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              URL daalo aur Go dabao -- website yahan dikhegi
            </p>
            <p className="text-xs text-muted-foreground/60">
              Note: Wikipedia, documentation sites kaam karti hain.
              Google/YouTube iframe block karti hain.
            </p>
          </div>
        )}

        {iframeSrc && !iframeBlocked && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            title="Web Viewer"
            data-ocid="master.canvas_target"
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
              data-ocid="master.secondary_button"
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
