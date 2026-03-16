import { Toaster } from "@/components/ui/sonner";
import { ClientPage } from "@/pages/ClientPage";
import { HomePage } from "@/pages/HomePage";
import { MasterPage } from "@/pages/MasterPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient();

type Screen =
  | { view: "home" }
  | { view: "master"; sessionId: string }
  | { view: "client"; sessionId: string; clientId: bigint };

function AppContent() {
  const [screen, setScreen] = useState<Screen>({ view: "home" });

  return (
    <>
      {screen.view === "home" && (
        <HomePage
          onEnterMaster={(sessionId) =>
            setScreen({ view: "master", sessionId })
          }
          onEnterClient={(sessionId, clientId) =>
            setScreen({ view: "client", sessionId, clientId })
          }
        />
      )}
      {screen.view === "master" && (
        <MasterPage
          sessionId={screen.sessionId}
          onBack={() => setScreen({ view: "home" })}
        />
      )}
      {screen.view === "client" && (
        <ClientPage
          sessionId={screen.sessionId}
          clientId={screen.clientId}
          onBack={() => setScreen({ view: "home" })}
        />
      )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
