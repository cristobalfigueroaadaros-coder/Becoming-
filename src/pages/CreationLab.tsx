import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useCreationLabData } from "@/hooks/useCreationLabData";
import { ModeSelector, type CreationLabMode } from "@/components/creation-lab/ModeSelector";
import { FocusMode } from "@/components/creation-lab/FocusMode";
import { LivingConstellation } from "@/components/creation-lab/LivingConstellation";
import { PurposeToValueMap } from "@/components/creation-lab/PurposeToValueMap";
import { PurposeOnboardingModal } from "@/components/PurposeOnboardingModal";

const modeConfig: Record<CreationLabMode, { title: string; description: string; color: string }> = {
  focus: {
    title: "Creation Lab • Focus",
    description: "Execute your current project with daily micro-steps",
    color: "from-primary/20 to-primary/5",
  },
  constellation: {
    title: "Creation Lab • Living Constellation",
    description: "Visualize patterns and connections in your journey",
    color: "from-accent/20 to-accent/5",
  },
  purpose: {
    title: "Creation Lab • Purpose to Value",
    description: "Translate your purpose into sustainable creation",
    color: "from-violet-500/20 to-violet-500/5",
  },
};

const CreationLab = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  
  // Get mode from URL or default to 'focus'
  const modeParam = searchParams.get("mode") as CreationLabMode | null;
  const [currentMode, setCurrentMode] = useState<CreationLabMode>(
    modeParam && ["focus", "constellation", "purpose"].includes(modeParam) 
      ? modeParam 
      : "focus"
  );

  // Shared data layer
  const {
    // Focus Mode data
    activeProject,
    setActiveProject,
    phases,
    steps,
    completeStep,
    skipStep,
    editStep,
    rescheduleStep,
    getTodaysStep,
    getCurrentPhase,
    getMissedSteps,
    skipMissedSteps,
    
    // Constellation data
    insightDots,
    dotConnections,
    
    // Purpose
    userPurpose,
    
    // State
    loading,
    refreshData,
  } = useCreationLabData();

  const todaysStep = getTodaysStep();
  const currentPhase = getCurrentPhase();
  const config = modeConfig[currentMode];

  // Update URL when mode changes
  const handleModeChange = (mode: CreationLabMode) => {
    setCurrentMode(mode);
    setSearchParams({ mode });
  };

  // Sync mode from URL on mount
  useEffect(() => {
    if (modeParam && ["focus", "constellation", "purpose"].includes(modeParam)) {
      setCurrentMode(modeParam as CreationLabMode);
    }
  }, [modeParam]);

  const handleCompleteStep = async (stepId: string, insight?: string) => {
    await completeStep(stepId, insight);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={`min-h-screen bg-gradient-to-br ${config.color} from-background via-background p-4 sm:p-8`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PurposeOnboardingModal 
        open={showPurposeModal}
        onClose={() => {
          setShowPurposeModal(false);
          refreshData();
        }}
        existingPurpose={userPurpose}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurposeModal(true)}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            {userPurpose ? "Edit Purpose" : "Set Purpose"}
          </Button>
        </div>

        {/* Hero Section */}
        <Card className="border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-accent" />
              {config.title}
            </CardTitle>
            <CardDescription className="text-base">
              {config.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mode Selector */}
        <ModeSelector
          currentMode={currentMode}
          onModeChange={handleModeChange}
          hasActiveProject={!!activeProject}
          dotCount={insightDots.length}
        />

        {/* Mode Content */}
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentMode === "focus" && (
            <FocusMode
              activeProject={activeProject}
              phases={phases}
              steps={steps}
              todaysStep={todaysStep}
              currentPhase={currentPhase}
              missedSteps={getMissedSteps()}
              onCompleteStep={handleCompleteStep}
              onSkipStep={skipStep}
              onEditStep={editStep}
              onRescheduleStep={rescheduleStep}
              onSkipMissedSteps={skipMissedSteps}
              onProjectUpdate={(updates) => setActiveProject(prev => prev ? { ...prev, ...updates } : null)}
            />
          )}

          {currentMode === "constellation" && (
            <LivingConstellation
              dots={insightDots}
              connections={dotConnections}
              userPurpose={userPurpose}
              onDataChange={refreshData}
              onEditPurpose={() => setShowPurposeModal(true)}
            />
          )}

          {currentMode === "purpose" && (
            <PurposeToValueMap userPurpose={userPurpose} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreationLab;
