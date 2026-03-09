import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShadowEncounterModal } from "@/components/ShadowEncounterModal";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { FutureSelfOmnipresenceModal } from "@/components/FutureSelfOmnipresenceModal";
import { useFutureSelfOmnipresence } from "@/hooks/useFutureSelfOmnipresence";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import Index from "./pages/Index";
import OnboardingRouter from "./components/OnboardingRouter";
import OnboardingStep1 from "./pages/OnboardingStep1";
import OnboardingStep2 from "./pages/OnboardingStep2";

import OnboardingStep4 from "./pages/OnboardingStep4";
import OnboardingQuest from "./pages/OnboardingQuest";
import OnboardingWorkContext from "./pages/OnboardingWorkContext";
import GravityOrientation from "./pages/GravityOrientation";
import GravityTransition from "./pages/GravityTransition";
import GravityCouncilIntro from "./pages/GravityCouncilIntro";
import GravityCouncilWelcome from "./pages/GravityCouncilWelcome";
import GravityFirstProject from "./pages/GravityFirstProject";
import OnboardingCompletion from "./pages/OnboardingCompletion";
import ProjectCouncilIntroduction from "./pages/ProjectCouncilIntroduction";
import Dashboard from "./pages/Dashboard";
import CommunityHub from "./pages/CommunityHub";

import LifeDomainsPage from "./pages/LifeDomainsPage";
import GoalStructurePage from "./pages/GoalStructurePage";
import ConstellationPage from "./pages/ConstellationPage";
import ConstellationInsightsDashboard from "./pages/ConstellationInsightsDashboard";
import QuestsPage from "./pages/QuestsPage";
import ActualSelfPage from "./pages/ActualSelfPage";
import FutureSelfDetailPage from "./pages/FutureSelfDetailPage";
import Chat from "./pages/Chat";
import CouncilMeeting from "./pages/CouncilMeeting";
import Council from "./pages/Council";
import CouncilLog from "./pages/CouncilLog";
import BuildersTeam from "./pages/BuildersTeam";
import InnerSelfCouncil from "./pages/InnerSelfCouncil";
import TransmutationCouncil from "./pages/TransmutationCouncil";
import MyTasks from "./pages/MyTasks";
import YourNewTasks from "./pages/YourNewTasks";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PurposeDiscoveryFlow from "./pages/PurposeDiscoveryFlow";
import PurposeEvolution from "./pages/PurposeEvolution";
import PurposeEvolutionEngine from "./pages/PurposeEvolutionEngine";
import MappingDotsPage from "./pages/MappingDotsPage";
import DailyPortal from "./pages/DailyPortal";
import ChallengeHistory from "./pages/ChallengeHistory";
import ChallengeReports from "./pages/ChallengeReports";
import DotConnectionEngine from "./pages/DotConnectionEngine";
import CreationLab from "./pages/CreationLab";
import EnergeticDashboard from "./pages/EnergeticDashboard";
import VibrationalPatternInsights from "./pages/VibrationalPatternInsights";
import OptimalTimingDashboard from "./pages/OptimalTimingDashboard";
import PatternMap from "./pages/PatternMap";
import SuperpowerMap from "./pages/SuperpowerMap";
import MomentumDashboard from "./pages/MomentumDashboard";
import CreatorsWall from "./pages/CreatorsWall";
import CreatorProfile from "./pages/CreatorProfile";
import LifeAssessment from "./pages/LifeAssessment";


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

const FutureSelfOmnipresenceWrapper = () => {
  const { currentMessage, dismissMessage } = useFutureSelfOmnipresence();

  return (
    <FutureSelfOmnipresenceModal
      message={currentMessage}
      onDismiss={dismissMessage}
    />
  );
};

// Helper component to redirect old chat routes to new Council structure
// CRITICAL: Preserves location.state for Voice handoff and Problem Clarification flows
const ChatRedirect = () => {
  const { mentorType } = useParams<{ mentorType: string }>();
  const location = useLocation();
  
  // Forward state to preserve voiceHandoffId, problemClarificationMode, etc.
  return (
    <Navigate 
      to={`/council?view=${mentorType}`} 
      replace 
      state={location.state}
    />
  );
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthReady(true);
      setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes to prevent stale session renders
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wait for auth state to be confirmed before rendering
  if (loading || !authReady) {
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
        <FutureSelfOmnipresenceWrapper />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={session ? <OnboardingRouter /> : <Index />} />
            {/* Redirect old /auth route to new merged page */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
            
            {/* Gravity Flow Routes */}
            <Route
              path="/gravity/orientation"
              element={session ? <GravityOrientation /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/transition"
              element={session ? <GravityTransition /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/council-introduction"
              element={session ? <ProjectCouncilIntroduction /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/council-intro"
              element={session ? <GravityCouncilIntro /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/council-welcome"
              element={session ? <GravityCouncilWelcome /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/onboarding-complete"
              element={session ? <OnboardingCompletion /> : <Navigate to="/" />}
            />
            <Route
              path="/gravity/first-project"
              element={session ? <GravityFirstProject /> : <Navigate to="/" />}
            />
            
            {/* Onboarding Routes */}
            <Route
              path="/onboarding"
              element={session ? <OnboardingStep1 /> : <Navigate to="/" />}
            />
            <Route
              path="/onboarding/step2"
              element={session ? <OnboardingStep2 /> : <Navigate to="/" />}
            />
            <Route
              path="/onboarding/step4"
              element={session ? <OnboardingStep4 /> : <Navigate to="/" />}
            />
            <Route
              path="/onboarding/quest"
              element={session ? <OnboardingQuest /> : <Navigate to="/" />}
            />
            <Route
              path="/onboarding/work-context"
              element={session ? <OnboardingWorkContext /> : <Navigate to="/" />}
            />
            {/* Console Thread - redirect to Council intake */}
            <Route
              path="/console-thread"
              element={session ? <Navigate to="/council?view=intake" replace /> : <Navigate to="/" />}
            />
            
            {/* Main App Routes with Bottom Navigation */}
            <Route
              path="/dashboard"
              element={session ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/creators"
              element={session ? <AppLayout><CreatorsWall /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/creators/:creatorId"
              element={session ? <AppLayout><CreatorProfile /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/council"
              element={session ? <AppLayout><Council /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/inner-self-council"
              element={session ? <AppLayout><InnerSelfCouncil /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/builders-team"
              element={session ? <AppLayout><BuildersTeam /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/transmutation-council"
              element={session ? <AppLayout><TransmutationCouncil /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/creation-lab"
              element={session ? <AppLayout><CreationLab /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/profile"
              element={session ? <AppLayout><Profile /></AppLayout> : <Navigate to="/" />}
            />
            <Route
              path="/profile/:userId"
              element={session ? <AppLayout><Profile /></AppLayout> : <Navigate to="/" />}
            />
            
            {/* Legacy routes - redirect to new Council structure */}
            <Route
              path="/council-meeting"
              element={session ? <Navigate to="/council?view=console" replace /> : <Navigate to="/" />}
            />
            <Route
              path="/chat/:mentorType"
              element={session ? <ChatRedirect /> : <Navigate to="/" />}
            />
            
            {/* Secondary routes (no bottom nav) */}
            <Route
              path="/community-hub"
              element={session ? <CommunityHub /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self"
              element={session ? <Navigate to="/creation-lab?type=becoming" replace /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/life-domains"
              element={session ? <LifeDomainsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/goals"
              element={session ? <GoalStructurePage /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/constellation"
              element={session ? <ConstellationPage /> : <Navigate to="/" />}
            />
            <Route
              path="/constellation-insights"
              element={session ? <ConstellationInsightsDashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/quests"
              element={session ? <QuestsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/actual-self"
              element={session ? <ActualSelfPage /> : <Navigate to="/" />}
            />
            <Route
              path="/future-self/detail"
              element={session ? <FutureSelfDetailPage /> : <Navigate to="/" />}
            />
            <Route
              path="/council-log"
              element={session ? <CouncilLog /> : <Navigate to="/" />}
            />
            <Route
              path="/my-tasks"
              element={session ? <MyTasks /> : <Navigate to="/" />}
            />
            <Route
              path="/your-new-tasks"
              element={session ? <YourNewTasks /> : <Navigate to="/" />}
            />
            <Route
              path="/premium"
              element={session ? <Premium /> : <Navigate to="/" />}
            />
            <Route
              path="/purpose-discovery"
              element={session ? <PurposeDiscoveryFlow /> : <Navigate to="/" />}
            />
            <Route
              path="/purpose-evolution"
              element={session ? <PurposeEvolution /> : <Navigate to="/" />}
            />
            <Route
              path="/purpose-evolution-engine"
              element={session ? <PurposeEvolutionEngine /> : <Navigate to="/" />}
            />
            <Route
              path="/mapping-dots"
              element={session ? <MappingDotsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/daily-portal"
              element={session ? <DailyPortal /> : <Navigate to="/" />}
            />
            <Route
              path="/challenge-history"
              element={session ? <ChallengeHistory /> : <Navigate to="/" />}
            />
            <Route
              path="/challenge-reports"
              element={session ? <ChallengeReports /> : <Navigate to="/" />}
            />
            <Route
              path="/dot-connection-engine"
              element={session ? <DotConnectionEngine /> : <Navigate to="/" />}
            />
            <Route
              path="/creation-lab"
              element={session ? <CreationLab /> : <Navigate to="/" />}
            />
            <Route
              path="/energetic-dashboard"
              element={session ? <EnergeticDashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/vibrational-insights"
              element={session ? <VibrationalPatternInsights /> : <Navigate to="/" />}
            />
            <Route
              path="/optimal-timing"
              element={session ? <OptimalTimingDashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/pattern-map/:patternId"
              element={session ? <PatternMap /> : <Navigate to="/" />}
            />
            <Route
              path="/superpower-map"
              element={session ? <SuperpowerMap /> : <Navigate to="/" />}
            />
            <Route
              path="/momentum"
              element={session ? <AppLayout><MomentumDashboard /></AppLayout> : <Navigate to="/" />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
