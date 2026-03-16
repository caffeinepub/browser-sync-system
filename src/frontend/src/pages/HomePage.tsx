import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@/hooks/useActor";
import { useCreateSession, useJoinSession } from "@/hooks/useQueries";
import {
  AlertCircle,
  ArrowRight,
  Globe,
  Loader2,
  Monitor,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface HomePageProps {
  onEnterMaster: (sessionId: string) => void;
  onEnterClient: (sessionId: string, clientId: bigint) => void;
}

export function HomePage({ onEnterMaster, onEnterClient }: HomePageProps) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [masterError, setMasterError] = useState("");

  const { actor, isFetching: actorLoading } = useActor();
  const createSession = useCreateSession();
  const joinSession = useJoinSession();

  const handleMaster = async () => {
    if (!actor) {
      toast.error("App abhi load ho rahi hai, thoda wait karein...");
      return;
    }
    setMasterError("");
    try {
      const id = await createSession.mutateAsync();
      onEnterMaster(id);
    } catch (err) {
      console.error("createSession error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Session create nahi hui. Dobara try karein.";
      setMasterError(msg);
      toast.error("Session create nahi hui.");
    }
  };

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      setJoinError("Please enter a session code");
      return;
    }
    setJoinError("");
    try {
      const clientId = await joinSession.mutateAsync(sessionCode.trim());
      onEnterClient(sessionCode.trim(), clientId);
    } catch {
      setJoinError("Could not join. Check the session code.");
    }
  };

  const masterLoading = actorLoading || createSession.isPending;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 glow-primary mb-4">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1
            className="text-4xl font-bold text-foreground glow-text mb-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Browser Sync
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time URL sync across multiple clients
          </p>
        </div>

        <div className="space-y-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              data-ocid="home.master_button"
              onClick={handleMaster}
              disabled={masterLoading}
              className="w-full h-16 text-lg font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 hover:border-primary/70 transition-all duration-200 glow-primary"
              variant="outline"
            >
              {masterLoading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Monitor className="w-5 h-5 mr-3" />
              )}
              {actorLoading
                ? "Loading..."
                : createSession.isPending
                  ? "Creating Session..."
                  : "Start as Master"}
              {!masterLoading && <ArrowRight className="w-4 h-4 ml-auto" />}
            </Button>
          </motion.div>

          {masterError && (
            <motion.div
              data-ocid="home.error_state"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed break-all">
                  {masterError}
                </p>
              </div>
              <Button
                data-ocid="home.primary_button"
                size="sm"
                variant="outline"
                onClick={handleMaster}
                disabled={masterLoading}
                className="self-start border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-7 px-3"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {!showJoinInput ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                data-ocid="home.client_button"
                onClick={() => setShowJoinInput(true)}
                className="w-full h-16 text-lg font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-muted-foreground/40 transition-all duration-200"
                variant="outline"
              >
                <Users className="w-5 h-5 mr-3" />
                Join as Client
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  Enter Session Code
                </p>
                <Input
                  data-ocid="home.session_input"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="Paste session code here..."
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
                  autoFocus
                />
                {joinError && (
                  <p
                    data-ocid="home.error_state"
                    className="text-xs text-destructive"
                  >
                    {joinError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowJoinInput(false);
                      setSessionCode("");
                      setJoinError("");
                    }}
                    className="flex-1 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="home.join_button"
                    onClick={handleJoin}
                    disabled={joinSession.isPending}
                    className="flex-1 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/40"
                    variant="outline"
                  >
                    {joinSession.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Join Session"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          Master controls the URL · Up to 5 clients sync in real-time
        </motion.p>
      </motion.div>

      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-muted-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
