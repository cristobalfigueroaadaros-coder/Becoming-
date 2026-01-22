import { Users, Target, Lightbulb, Hammer, CheckSquare, LucideIcon } from 'lucide-react';
import { PhaseType } from './types';

export interface PhaseConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  coreQuestion: string;
  reflectionPrompt: string;
  mentorType: string;
  mentorLabel: string;
}

export const PHASE_CONFIG: Record<PhaseType, PhaseConfig> = {
  empathize: {
    icon: Users,
    color: 'hsl(48, 89%, 70%)',
    bgColor: 'hsl(48, 89%, 70%, 0.15)',
    borderColor: 'hsl(48, 89%, 60%)',
    coreQuestion: "What is really happening for the people involved?",
    reflectionPrompt: "What surprised you the most so far?",
    mentorType: 'perspective',
    mentorLabel: "Explore this with the Perspective mentor"
  },
  define: {
    icon: Target,
    color: 'hsl(20, 85%, 72%)',
    bgColor: 'hsl(20, 85%, 72%, 0.15)',
    borderColor: 'hsl(20, 85%, 62%)',
    coreQuestion: "What am I focusing on solving right now?",
    reflectionPrompt: "What would change if this wasn't the real problem?",
    mentorType: 'business_mentor',
    mentorLabel: "Clarify the problem with the Business mentor"
  },
  ideate: {
    icon: Lightbulb,
    color: 'hsl(326, 78%, 85%)',
    bgColor: 'hsl(326, 78%, 85%, 0.15)',
    borderColor: 'hsl(326, 78%, 75%)',
    coreQuestion: "What are the possible ways forward?",
    reflectionPrompt: "What's one option you haven't considered yet?",
    mentorType: 'design-thinking',
    mentorLabel: "Explore this with the Design Thinking mentor"
  },
  prototype: {
    icon: Hammer,
    color: 'hsl(224, 30%, 65%)',
    bgColor: 'hsl(224, 30%, 65%, 0.15)',
    borderColor: 'hsl(224, 30%, 55%)',
    coreQuestion: "What am I actually trying out?",
    reflectionPrompt: "What are you hoping to learn from this?",
    mentorType: 'design-thinking',
    mentorLabel: "Explore this with the Design Thinking mentor"
  },
  test: {
    icon: CheckSquare,
    color: 'hsl(166, 55%, 65%)',
    bgColor: 'hsl(166, 55%, 65%, 0.15)',
    borderColor: 'hsl(166, 55%, 55%)',
    coreQuestion: "What did I learn by doing?",
    reflectionPrompt: "What changed after taking action?",
    mentorType: 'design-thinking',
    mentorLabel: "Explore this with the Design Thinking mentor"
  }
};

export const PHASE_ORDER: PhaseType[] = ['empathize', 'define', 'ideate', 'prototype', 'test'];

export const PHASE_ANGLES: Record<PhaseType, { start: number; end: number }> = {
  empathize: { start: -90, end: -18 },
  define: { start: -18, end: 54 },
  ideate: { start: 54, end: 126 },
  prototype: { start: 126, end: 198 },
  test: { start: 198, end: 270 }
};
