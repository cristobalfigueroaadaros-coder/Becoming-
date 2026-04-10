import { Users, Target, Lightbulb, Hammer, CheckSquare, RefreshCw, LucideIcon } from 'lucide-react';
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
  },
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
  iterate: {
    icon: RefreshCw,
    color: 'hsl(174, 72%, 56%)',
    bgColor: 'hsl(174, 72%, 56%, 0.15)',
    borderColor: 'hsl(174, 72%, 46%)',
    coreQuestion: "How am I applying what I learned to the next cycle?",
    reflectionPrompt: "What's the most important change going into the next iteration?",
    mentorType: 'strategist_mentor',
    mentorLabel: "Plan your next iteration with the Strategist"
  },
};

// Cycle order: Define → Ideate → Prototype → Test → Empathize → Iterate → (back to Define)
export const PHASE_ORDER: PhaseType[] = ['define', 'ideate', 'prototype', 'test', 'empathize', 'iterate'];

export const PHASE_ANGLES: Record<PhaseType, { start: number; end: number }> = {
  define:    { start: -90, end: -30 },
  ideate:    { start: -30, end:  30 },
  prototype: { start:  30, end:  90 },
  test:      { start:  90, end: 150 },
  empathize: { start: 150, end: 210 },
  iterate:   { start: 210, end: 270 },
};

export const PHASE_PLACEHOLDERS: Record<PhaseType, string> = {
  define:    "e.g., 'The core problem is decision paralysis'",
  ideate:    "e.g., 'What if we simplified to 3 options?'",
  prototype: "e.g., 'Testing a simple A/B flow'",
  test:      "e.g., 'Users preferred option B by 3:1'",
  empathize: "e.g., 'Users feel overwhelmed by too many choices'",
  iterate:   "e.g., 'Adding fun interactions based on user feedback'",
};
