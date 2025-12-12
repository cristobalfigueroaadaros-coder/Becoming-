import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lightbulb, Rocket, CheckCircle2, Trash2, Edit, Plus, Target, Sparkles, TrendingUp, Calendar, Clock, Play } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";
import { IntegratorPhaseTimeline } from "@/components/integrator/IntegratorPhaseTimeline";
import { IntegratorCalendar } from "@/components/integrator/IntegratorCalendar";
import { IntegratorDailyStepCard } from "@/components/integrator/IntegratorDailyStepCard";

const statusOptions = [
  { value: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-muted' },
  { value: 'building', label: 'Building', icon: Rocket, color: 'bg-accent' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-primary' },
];

const CreationLab = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [progressNotes, setProgressNotes] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("journey");

  // Integrator hook
  const {
    activeProject: integratorProject,
    phases,
    steps,
    loading: integratorLoading,
    completeStep,
    getTodaysStep,
    getCurrentPhase
  } = useIntegratorProjects();

  const todaysStep = getTodaysStep();
  const currentPhase = getCurrentPhase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projectsData, error: projectsError } = await supabase
        .from('creation_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: analysisData, error: analysisError } = await supabase
        .from('dot_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!analysisError && analysisData) {
        setLatestAnalysis(analysisData);
      }
    } catch (error: any) {
      console.error("Load error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const importIdeasFromAnalysis = async () => {
    if (!latestAnalysis) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const creationIdeas = latestAnalysis.connections || [];
      const ideasToImport = creationIdeas.map((idea: any) => ({
        user_id: user.id,
        title: idea.title || 'Untitled Idea',
        description: idea.description || '',
        dot_connections: idea.dotConnections || [],
        first_step: idea.firstStep || 'Define next steps',
        impact: idea.impact || '',
        status: 'idea'
      }));

      const { error } = await supabase
        .from('creation_projects')
        .insert(ideasToImport);

      if (error) throw error;

      toast.success(`Imported ${ideasToImport.length} creation ideas!`);
      setImportDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('creation_projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      toast.success("Status updated!");
      loadData();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message);
    }
  };

  const updateProgressNotes = async () => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('creation_projects')
        .update({ progress_notes: progressNotes })
        .eq('id', selectedProject.id);

      if (error) throw error;

      toast.success("Progress saved!");
      setEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Delete this project?")) return;

    try {
      const { error } = await supabase
        .from('creation_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success("Project deleted");
      loadData();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message);
    }
  };

  const convertToTask = async (project: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          task_title: project.title,
          task_description: `${project.description}\n\nFirst Step: ${project.first_step}`,
          mentor_name: 'Creative Intelligence',
          status: 'pending',
          xp_value: 50,
        });

      if (error) throw error;

      toast.success("Converted to task!");
      navigate("/my-tasks");
    } catch (error: any) {
      console.error("Convert error:", error);
      toast.error(error.message);
    }
  };

  const groupedProjects = statusOptions.reduce((acc, status) => {
    acc[status.value] = projects.filter(p => p.status === status.value);
    return acc;
  }, {} as Record<string, any[]>);

  const handleCompleteStep = async (stepId: string, insight?: string) => {
    await completeStep(stepId, insight);
  };

  if (loading || integratorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 sm:p-8">
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
          <div className="flex gap-2">
            {latestAnalysis && (
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Import Ideas
              </Button>
            )}
            <Button
              onClick={() => navigate("/dot-connection-engine")}
              size="sm"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-accent" />
              Creation Lab
            </CardTitle>
            <CardDescription className="text-base">
              Turn your insights into reality. Track projects from idea to completion.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabs for Active Journey vs Legacy Ideas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="journey" className="gap-2">
              <Play className="w-4 h-4" />
              Active Journey
              {integratorProject && (
                <Badge variant="secondary" className="ml-2">1</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Ideas
              <Badge variant="outline" className="ml-2">{projects.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Active Journey Tab */}
          <TabsContent value="journey" className="space-y-6">
            {integratorProject ? (
              <>
                {/* Project Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{integratorProject.project_title}</CardTitle>
                        <CardDescription>{integratorProject.project_description}</CardDescription>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="capitalize"
                        style={{ 
                          backgroundColor: currentPhase?.phase_color ? `${currentPhase.phase_color}60` : undefined 
                        }}
                      >
                        {integratorProject.current_phase}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IntegratorPhaseTimeline
                      phases={phases}
                      currentDay={integratorProject.current_day}
                      totalDays={integratorProject.timeframe_days}
                    />
                  </CardContent>
                </Card>

                {/* Today's Step */}
                {todaysStep && currentPhase && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Today's Step
                    </h3>
                    <IntegratorDailyStepCard
                      step={todaysStep}
                      phase={currentPhase}
                      totalDays={integratorProject.timeframe_days}
                      onComplete={handleCompleteStep}
                    />
                  </div>
                )}

                {/* Calendar View */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Your Journey Calendar
                    </CardTitle>
                    <CardDescription>
                      Click any day to see details or add insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IntegratorCalendar
                      steps={steps}
                      phases={phases}
                      onCompleteStep={handleCompleteStep}
                      currentDay={integratorProject.current_day}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <Rocket className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Journey</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start a journey from a breakthrough in your mentor conversations, or run a dot connection analysis to discover new ideas.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/chat")}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Talk to Mentors
                    </Button>
                    <Button 
                      onClick={() => navigate("/dot-connection-engine")}
                      className="gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Analyze Dots
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ideas Tab (Legacy Projects) */}
          <TabsContent value="ideas" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-muted-foreground">{groupedProjects.idea?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Ideas</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-accent">{groupedProjects.building?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Building</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-primary">{groupedProjects.completed?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </Card>
            </div>

            {/* Projects by Status */}
            {statusOptions.map(statusOption => {
              const StatusIcon = statusOption.icon;
              const projectsInStatus = groupedProjects[statusOption.value] || [];

              return (
                <div key={statusOption.value} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${statusOption.color} flex items-center justify-center`}>
                      <StatusIcon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{statusOption.label}</h2>
                      <p className="text-sm text-muted-foreground">{projectsInStatus.length} projects</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {projectsInStatus.map((project) => (
                        <motion.div
                          key={project.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <Card className="border-l-4 border-l-accent/50 hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center justify-between">
                                <span>{project.title}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setProgressNotes(project.progress_notes || "");
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteProject(project.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {project.description}
                              </p>

                              {project.dot_connections && project.dot_connections.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {project.dot_connections.map((conn: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {conn}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2 pt-3 border-t border-border/30">
                                <div className="flex items-start gap-2">
                                  <Target className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                                      First Step
                                    </p>
                                    <p className="text-sm">{project.first_step}</p>
                                  </div>
                                </div>

                                {project.impact && (
                                  <div className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        Impact
                                      </p>
                                      <p className="text-sm">{project.impact}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {project.progress_notes && (
                                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                                  <p className="font-semibold text-xs mb-1">Progress Notes:</p>
                                  <p className="text-muted-foreground">{project.progress_notes}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                {statusOptions
                                  .filter(s => s.value !== project.status)
                                  .map(nextStatus => (
                                    <Button
                                      key={nextStatus.value}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateProjectStatus(project.id, nextStatus.value)}
                                      className="flex-1"
                                    >
                                      Move to {nextStatus.label}
                                    </Button>
                                  ))}
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => convertToTask(project)}
                                >
                                  <Target className="w-3 h-3 mr-1" />
                                  Task
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {projectsInStatus.length === 0 && (
                      <Card className="border-dashed border-2 col-span-full">
                        <CardContent className="pt-12 pb-12 text-center">
                          <StatusIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No {statusOption.label.toLowerCase()} projects yet
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
              <DialogDescription>
                Add notes about your progress on this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="What have you done? What's next?"
                rows={6}
              />
              <div className="flex gap-2">
                <Button onClick={updateProgressNotes} className="flex-1">
                  Save Progress
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Creation Ideas</DialogTitle>
              <DialogDescription>
                Import ideas from your latest Dot-Connection Analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will import creation ideas from your most recent analysis into the Creation Lab.
              </p>
              <div className="flex gap-2">
                <Button onClick={importIdeasFromAnalysis} className="flex-1">
                  Import Ideas
                </Button>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreationLab;
