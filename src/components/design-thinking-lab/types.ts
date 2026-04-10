export type PhaseType = 'define' | 'ideate' | 'prototype' | 'test' | 'empathize' | 'iterate';

export interface PhaseNote {
  id: string;
  text: string;
  source: 'manual' | 'task' | 'mentor' | 'feedback' | 'name_evolution';
  sourceId?: string;
  sourceContext?: string;
  createdAt: string;
}

export interface PhaseContentData {
  phase: PhaseType;
  notes: PhaseNote[];
  reflectionResponse?: string;
  autoPopulatedItems: PhaseNote[];
}

export interface ProjectInfo {
  id: string;
  title: string;
  description: string;
  currentFocus?: string;
  latestSnapshot?: string;
}

export interface NameEvolutionEvent {
  id: string;
  oldName: string;
  newName: string;
  reason?: string;
  changeType: 'conceptual' | 'action_driven' | 'clarification';
  relatedPhase: PhaseType;
  createdAt: string;
}

export interface EvolutionMilestone {
  id: string;
  title: string;
  explanation?: string;
  relatedPhase?: PhaseType;
  date: string;
  type: 'system' | 'manual' | 'name_change' | 'task_completed' | 'mentor_insight';
  sourceData?: any;
}

export interface KeyLearning {
  id: string;
  text: string;
  source: string;
  date: string;
}

export interface BeforeNowComparison {
  before: string;
  now: string;
}

export interface DesignThinkingIteration {
  id: string;
  iterationNumber: number;
  status: 'active' | 'completed';
  summary?: string;
  completedAt?: string;
  createdAt: string;
}
