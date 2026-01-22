import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProblemClarificationStatus {
  needsClarification: boolean;
  projectId: string | null;
  projectName: string | null;
  projectDescription: string | null;
  badgeCount: number;
  loading: boolean;
  isInClarificationSession: boolean;
}

export const useProblemClarificationStatus = (): ProblemClarificationStatus => {
  const location = useLocation();
  const [status, setStatus] = useState<Omit<ProblemClarificationStatus, 'isInClarificationSession'>>({
    needsClarification: false,
    projectId: null,
    projectName: null,
    projectDescription: null,
    badgeCount: 0,
    loading: true,
  });

  // Hide badges during onboarding
  const isOnboarding = location.pathname.startsWith('/gravity');
  
  // Auto-detect if user is in business mentor chat for problem clarification
  const isInClarificationSession = 
    location.pathname === '/chat/business_mentor' || 
    (location.pathname.includes('/chat') && location.search.includes('mentor=business_mentor'));

  useEffect(() => {
    const checkStatus = async () => {
      // If user is in onboarding, no badges needed
      if (isOnboarding) {
        setStatus({
          needsClarification: false,
          projectId: null,
          projectName: null,
          projectDescription: null,
          badgeCount: 0,
          loading: false,
        });
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        // Check if user has completed second win
        const { data: profile } = await supabase
          .from("profiles")
          .select("second_win_completed_at")
          .eq("id", user.id)
          .maybeSingle();

        // If second win already completed, no clarification needed
        if (profile?.second_win_completed_at) {
          setStatus({
            needsClarification: false,
            projectId: null,
            projectName: null,
            projectDescription: null,
            badgeCount: 0,
            loading: false,
          });
          return;
        }

        // Check for active project that needs problem clarification
        const { data: project } = await supabase
          .from("integrator_projects")
          .select("id, project_title, project_description, needs_problem_clarification, problem_clarified_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!project) {
          setStatus({
            needsClarification: false,
            projectId: null,
            projectName: null,
            projectDescription: null,
            badgeCount: 0,
            loading: false,
          });
          return;
        }

        // Check if this project already has a confirmed problem
        const { data: confirmedProblem } = await supabase
          .from("project_problems")
          .select("id")
          .eq("project_id", project.id)
          .eq("is_confirmed", true)
          .limit(1)
          .maybeSingle();

        const needsClarification = !confirmedProblem && !project.problem_clarified_at;

        setStatus({
          needsClarification,
          projectId: needsClarification ? project.id : null,
          projectName: needsClarification ? project.project_title : null,
          projectDescription: needsClarification ? project.project_description : null,
          badgeCount: needsClarification ? 1 : 0,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking problem clarification status:", error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkStatus();

    // Subscribe to changes in integrator_projects and project_problems
    const channel = supabase
      .channel("problem-clarification-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "integrator_projects" }, checkStatus)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_problems" }, checkStatus)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, checkStatus)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnboarding]);

  return {
    ...status,
    isInClarificationSession,
  };
};
