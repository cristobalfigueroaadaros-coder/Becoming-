import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShadowEncounterModal } from "@/components/ShadowEncounterModal";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { toast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OnboardingStep1 from "./pages/OnboardingStep1";
import OnboardingStep2 from "./pages/OnboardingStep2";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import CouncilMeeting from "./pages/CouncilMeeting";
import CouncilLog from "./pages/CouncilLog";
import MyTasks from "./pages/MyTasks";
import YourNewTasks from "./pages/YourNewTasks";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ShadowEncounterWrapper = () => {
  const { activeEncounter, refetch } = useShadowEncounters();

  const handleDeferEncounter = async () => {
    if (!activeEncounter) return;
    
    try {
      const { error } = await supabase
        .from("shadow_encounters")
        .update({ status: "deferred" })
        .eq("id", activeEncounter.id);
      
      if (error) throw error;
      
      refetch();
      toast({
        title: "Shadow encounter deferred",
        description: "It will return later.",
      });
    } catch (error: any) {
      console.error("Failed to defer encounter:", error);
      toast({
        title: "Error",
        description: "Failed to defer encounter",
        variant: "destructive",
      });
    }
  };

  if (!activeEncounter) return null;

  return (
    <ShadowEncounterModal
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          handleDeferEncounter();
        }
      }}
      encounterId={activeEncounter.id}
      shadowName={activeEncounter.shadow_name}
      shadowStatement={activeEncounter.shadow_statement}
      reflectionPrompts={activeEncounter.reflection_prompts || []}
      taskDescription={activeEncounter.task_description}
      mentorType={activeEncounter.mentor_type}
      xpReward={activeEncounter.xp_reward}
      onComplete={refetch}
    />
  );
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ShadowEncounterWrapper />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Index />} />
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route
              path="/onboarding"
              element={session ? <OnboardingStep1 /> : <Navigate to="/auth" />}
            />
            <Route
              path="/onboarding/step2"
              element={session ? <OnboardingStep2 /> : <Navigate to="/auth" />}
            />
            <Route
              path="/dashboard"
              element={session ? <Dashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/chat/:mentorType"
              element={session ? <Chat /> : <Navigate to="/auth" />}
            />
            <Route
              path="/council-meeting"
              element={session ? <CouncilMeeting /> : <Navigate to="/auth" />}
            />
            <Route
              path="/council-log"
              element={session ? <CouncilLog /> : <Navigate to="/auth" />}
            />
            <Route
              path="/my-tasks"
              element={session ? <MyTasks /> : <Navigate to="/auth" />}
            />
            <Route
              path="/your-new-tasks"
              element={session ? <YourNewTasks /> : <Navigate to="/auth" />}
            />
            <Route
              path="/premium"
              element={session ? <Premium /> : <Navigate to="/auth" />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
