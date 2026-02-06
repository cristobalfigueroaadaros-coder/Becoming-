
# Transmutation Console Adaptation - Implementation Plan

## Executive Summary

This plan migrates the life event initiation flow from the **Inner Self Console** to the **Transmutation Console**, ensuring reliable Pattern Map population and Winning Card activation. This is a **migration and refinement**, not a redesign - the existing flow logic is preserved and relocated.

---

## Part 1: Current State Analysis

### What Exists Today

| Component | Location | Function |
|-----------|----------|----------|
| Life Event Initiation Card | `InnerSelfCouncil.tsx` (lines 434-493) | State-aware onboarding for first/returning users |
| Transmutation Council | `TransmutationCouncil.tsx` | Multi-mentor chat (Storybreaker, Phoenix, Stoic) |
| Pattern Detection | `chat-mentor` edge function | Inner Clarity Mentor extracts pattern JSON |
| Winning Card | `PatternDiscoveryCard.tsx` | Confirmation UI for pattern acceptance |
| Pattern Map | `PatternMapCanvas.tsx` | 6-node visual map (Trigger, Old Story, Mental Loop, Cost, Protective Role, Life Event) |

### Current Problems

1. Life event initiation in Inner Self Console leads to overly reflective conversations
2. Pattern extraction by Inner Clarity Mentor is inconsistent
3. Winning Card doesn't always trigger
4. Pattern Map nodes not reliably populated

---

## Part 2: Architectural Changes

### 2.1 Entry Point Migration

**Move**: The initiation card UI from `InnerSelfCouncil.tsx` to `TransmutationCouncil.tsx`

This includes:
- "This is a safe space" copy
- State 1 (First Time) and State 2 (Returning User) variations
- Placeholder examples

### 2.2 Flow Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSMUTATION CONSOLE                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Initiation Card (migrated from Inner Self Console)          │
│     - Safe space messaging                                       │
│     - Life event invitation                                      │
│     - State-aware copy (first time vs returning)                 │
├─────────────────────────────────────────────────────────────────┤
│  2. Transmutation Council Flow (unchanged)                       │
│     - Storybreaker, Phoenix, Stoic mentors                       │
│     - Multiple perspectives + banter                             │
│     - 1 expansion question → user answer → more banter           │
├─────────────────────────────────────────────────────────────────┤
│  3. Natural Handoff to Storybreaker Mentor (1:1)                 │
│     - System suggests handoff at appropriate moment              │
│     - Context passed via conversation_handoffs                   │
├─────────────────────────────────────────────────────────────────┤
│  4. Storybreaker Mentor Extraction (2-3 questions max)           │
│     - Emotion: "What emotion was strongest?"                     │
│     - Fear: "What were you most afraid of?"                      │
│     - Trigger: "What caused this situation?"                     │
│     - Life moment in time: "Where were you in life?"             │
├─────────────────────────────────────────────────────────────────┤
│  5. Pattern Map Population                                       │
│     - Minimum: Life Event + Trigger + Primary Emotion + Fear/Story│
│     - Nodes: Trigger, Emotions, Fears, Old Story, Cost, Protective│
├─────────────────────────────────────────────────────────────────┤
│  6. Winning Card Activation                                      │
│     - When minimum requirements met                              │
│     - User confirmation → Transmutation unlocked                 │
├─────────────────────────────────────────────────────────────────┤
│  7. Transmutation Phase (learnings, lessons, knowledge)          │
│  8. Gold Phase (identity integration, wisdom transmission)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/TransmutationCouncil.tsx` | **Major Update** | Add initiation card, state detection, handoff logic, pattern card UI |
| `supabase/functions/chat-mentor/index.ts` | **Update** | Modify Storybreaker Mentor prompt for pattern extraction |
| `src/pages/InnerSelfCouncil.tsx` | **Simplify** | Remove initiation card, leave as reflection-only space |
| `src/components/pattern-map/PatternMapCanvas.tsx` | **Update** | Add Emotions and Fears nodes |
| `src/hooks/useInnerPatterns.tsx` | **Update** | Add emotions/fears to PatternInput interface |

---

## Part 4: Detailed Implementation

### 4.1 TransmutationCouncil.tsx Updates

#### 4.1.1 Add State Detection

```typescript
// New imports
import { PatternDiscoveryCard, PatternCelebration } from "@/components/pattern-map";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";

// New state
const [hasCompletedTransmutation, setHasCompletedTransmutation] = useState(false);
const [isLoadingState, setIsLoadingState] = useState(true);
const [patternDetection, setPatternDetection] = useState<any>(null);
const [showPatternCard, setShowPatternCard] = useState(false);
const [showCelebration, setShowCelebration] = useState(false);
const [createdPatternId, setCreatedPatternId] = useState<string | null>(null);
const { createPattern } = useInnerPatterns();

// Check transmutation history on mount
useEffect(() => {
  const checkTransmutationHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoadingState(false);
      return;
    }
    
    const { data: transmutedPatterns } = await supabase
      .from("inner_patterns")
      .select("id")
      .eq("user_id", user.id)
      .or("status.eq.transmuted,transformed_at.not.is.null")
      .limit(1);
    
    if (transmutedPatterns && transmutedPatterns.length > 0) {
      setHasCompletedTransmutation(true);
    }
    setIsLoadingState(false);
  };
  checkTransmutationHistory();
}, []);
```

#### 4.1.2 Add Initiation Card (Migrated Copy)

Replace the current empty state card (lines 217-247) with:

```tsx
{messages.length === 0 && !isLoadingState && (
  <Card className="mt-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Sparkles className="w-5 h-5 text-amber-500" />
        The Transmutation Journey
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Mentor badges */}
      <div className="grid gap-3">
        {TRANSMUTATION_MENTORS.map((mentor) => {
          const config = mentorConfig[mentor];
          return (
            <div key={mentor} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className="font-medium">{config.name}</p>
                <p className="text-sm text-muted-foreground">{config.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* State-aware initiation copy */}
      {hasCompletedTransmutation ? (
        <div className="space-y-3 pt-2 border-t border-amber-500/20">
          <p className="text-base font-medium text-foreground">
            You've already worked through something important here.
          </p>
          <p className="text-sm text-muted-foreground">
            If you feel ready, this space can hold something deeper this time.
          </p>
          <p className="text-sm text-muted-foreground">
            You might choose a life moment that still carries emotional weight for you.
            Something that shaped you in a lasting way.
          </p>
          <p className="text-sm text-muted-foreground">
            Or, if that doesn't feel right today, you can share another meaningful experience instead.
            <strong> You're always in control.</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-2 border-t border-amber-500/20">
          <p className="text-base font-medium text-foreground">
            Let's pause for a moment and look inward.
          </p>
          <p className="text-sm text-muted-foreground">
            This is a safe space. You're in control of what you share.
          </p>
          <p className="text-sm text-muted-foreground">
            To begin, think about a life event that challenged you, changed you, 
            or marked a turning point for you.
          </p>
          <p className="text-sm text-muted-foreground">
            It doesn't have to be dramatic or traumatic.
            It could be a big decision, a transition, a failure, a loss, 
            or a moment when life pushed you in a new direction.
          </p>
          <p className="text-sm font-medium text-foreground">
            Share what feels meaningful to you right now.
          </p>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

#### 4.1.3 Add Pattern Detection and Winning Card

```tsx
// In handleSubmit, after getting response:
if (data?.patternDetection) {
  setPatternDetection(data.patternDetection);
  setShowPatternCard(true);
}

// Pattern acceptance handler
const handlePatternAccept = async (patternName: string) => {
  if (!patternDetection) return;
  
  const lifeEventsData = {
    trigger_event: patternDetection.triggerEvent || '',
    old_story: patternDetection.oldStory || '',
    mental_loop: patternDetection.mentalLoop || '',
    cost: patternDetection.cost || patternDetection.fear || '',
    protective_role: patternDetection.protectiveRole || '',
    life_event: patternDetection.lifeEvent || '',
    life_event_age_category: patternDetection.lifeEventAgeCategory || '',
    primary_emotion: patternDetection.primaryEmotion || '',
    fears: patternDetection.fears || patternDetection.fear || '',
  };
  
  const transmutationData = {
    shadow: patternDetection.oldStory || patternDetection.fear || '',
  };
  
  const pattern = await createPattern({
    pattern_name: patternName,
    pattern_type: patternDetection.patternType || 'life_event',
    pattern_description: patternDetection.lifeEvent || '',
    trigger_context: patternDetection.triggerEvent || '',
    primary_emotion: patternDetection.primaryEmotion || '',
    related_emotions: patternDetection.relatedEmotions || [],
    body_sensation: patternDetection.bodySensation || '',
    life_events: lifeEventsData,
    transmutation_data: transmutationData,
  });
  
  if (pattern) {
    setCreatedPatternId(pattern.id);
    setShowPatternCard(false);
    setShowCelebration(true);
  }
};

// Render Pattern Discovery Card
{showPatternCard && patternDetection && (
  <PatternDiscoveryCard
    proposedName={patternDetection.patternName}
    patternType={patternDetection.patternType || 'life_event'}
    triggerContext={patternDetection.triggerEvent || ''}
    primaryEmotion={patternDetection.primaryEmotion || ''}
    summary={patternDetection.lifeEvent}
    onAccept={handlePatternAccept}
    onKeepExploring={() => {
      setShowPatternCard(false);
      setPatternDetection(null);
    }}
  />
)}

{showCelebration && createdPatternId && (
  <PatternCelebration
    patternId={createdPatternId}
    onContinue={() => {
      setShowCelebration(false);
      navigate(`/creation-lab?type=becoming&bmode=transmutation`);
    }}
    onClose={() => setShowCelebration(false)}
  />
)}
```

---

### 4.2 Storybreaker Mentor Prompt Update

**File**: `supabase/functions/chat-mentor/index.ts`

Update the `storybreaker_mentor` prompt to add pattern extraction capability (currently only in `inner_clarity_mentor`):

```typescript
storybreaker_mentor: `You are The Storybreaker Mentor — Byron Katie meets CBT Therapist, warm and human.

${HUMAN_CONVERSATION_RULES}

=== CORE ESSENCE ===
Your reality is shaped by the story you keep repeating.

=== TRANSMUTATION CONSOLE ROLE ===
When receiving context from the Transmutation Council about a life event:
1. Start with: "I've read what you shared with the council. Thank you for trusting us with something meaningful."
2. Ask 2-3 focused questions (MAXIMUM) to extract missing information:
   - EMOTION: "What emotion was strongest in that moment?"
   - FEAR: "What were you most afraid of, or what did you fear might happen?"
   - TRIGGER: "What caused this situation, or what led up to it?"
   - LIFE MOMENT: "Where were you in your life when this happened?"
3. Only ask questions for information NOT already provided
4. When you have: Life Event + Trigger + Primary Emotion + Fear/Old Story, propose a name

=== PATTERN EXTRACTION (MANDATORY) ===
When minimum requirements are met (Life Event + Trigger + Emotion + Fear), include:

\`\`\`json
{
  "patternName": "2-7 word name for this life event or pattern",
  "patternType": "life_event | core_wound | limiting_belief",
  "lifeEvent": "The original life event",
  "triggerEvent": "What triggers this pattern",
  "primaryEmotion": "The main emotion",
  "relatedEmotions": ["other", "emotions"],
  "fear": "What they feared most",
  "oldStory": "The narrative they tell themselves",
  "protectiveRole": "How this pattern protected them (inferred)",
  "cost": "What this costs them (can equal fear)",
  "lifeEventAgeCategory": "childhood | teen | young_adult | adult | recent"
}
\`\`\`
[PATTERN_READY]

=== MINIMUM TO UNLOCK WINNING CARD ===
- Life Event (already known from council)
- Trigger
- Primary Emotion  
- Fear OR Old Story

Note: Fear can replace cost. Cost can be inferred from fear. Protective role is always inferred.

=== FORBIDDEN ===
- Do NOT ask more than 3 questions total
- Do NOT ask for information already shared
- Do NOT show raw JSON to the user
- Do NOT skip to solutions before extraction is complete

${DISCOVERY_QUESTIONS}`
```

---

### 4.3 Pattern Map Node Updates

**File**: `src/components/pattern-map/PatternMapCanvas.tsx`

Add Emotions and Fears nodes to the Pattern Map:

```typescript
const NODE_TYPES = [
  { id: 'trigger_event', label: 'Trigger', angle: -90 },
  { id: 'primary_emotion', label: 'Emotion', angle: -45 }, // NEW
  { id: 'old_story', label: 'Old Story', angle: 0 },
  { id: 'fears', label: 'Fears', angle: 45 }, // NEW
  { id: 'mental_loop', label: 'Mental Loop', angle: 90 },
  { id: 'cost', label: 'Cost', angle: 135 },
  { id: 'protective_role', label: 'Protective Role', angle: 180 },
  { id: 'life_event', label: 'Life Event', angle: 225 },
];
```

Update `PatternNodeData` interface:

```typescript
interface PatternNodeData {
  trigger_event?: string;
  primary_emotion?: string; // NEW
  fears?: string; // NEW
  old_story?: string;
  mental_loop?: string;
  cost?: string;
  protective_role?: string;
  life_event?: string;
  life_event_age_category?: string;
}
```

---

### 4.4 Inner Self Console Simplification

**File**: `src/pages/InnerSelfCouncil.tsx`

Remove the initiation card (lines 434-493) and replace with a simple reflection-focused introduction:

```tsx
{!hasActiveThread && stage === 'input' && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {INNER_SELF_MENTORS.map((mentor) => (
            <div key={mentor} className="flex items-center gap-2">
              <span className="text-xl">{mentorIcons[mentor]}</span>
              <span className="text-sm font-medium">{mentorNames[mentor]}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-3 pt-2">
          <p className="text-base font-medium text-foreground">
            A space for reflection and clarity.
          </p>
          <p className="text-sm text-muted-foreground">
            Share what's on your mind. The Inner Self Council offers
            multiple perspectives to help you understand yourself more deeply.
          </p>
          <p className="text-sm text-muted-foreground italic">
            For life event transmutation, visit the{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-500"
              onClick={() => navigate("/transmutation-council")}
            >
              Transmutation Council
            </Button>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)}
```

---

### 4.5 useInnerPatterns Hook Update

**File**: `src/hooks/useInnerPatterns.tsx`

Extend the `PatternInput` interface:

```typescript
export interface PatternInput {
  pattern_name: string;
  pattern_description?: string;
  pattern_type?: string;
  source_council_meeting_id?: string;
  source_mentor?: string;
  trigger_context?: string;
  primary_emotion?: string;
  related_emotions?: string[];
  body_sensation?: string;
  life_events?: {
    trigger_event?: string;
    primary_emotion?: string; // NEW
    fears?: string; // NEW
    old_story?: string;
    mental_loop?: string;
    cost?: string;
    protective_role?: string;
    life_event?: string;
    life_event_age_category?: string;
  };
  transmutation_data?: {
    shadow?: string;
  };
}
```

---

## Part 5: Edge Function Updates

### 5.1 council-meeting Function

**File**: `supabase/functions/council-meeting/index.ts`

Add Transmutation Council-specific handling to suggest Storybreaker handoff after 2-3 exchanges:

The existing `council-meeting` function already supports `councilType: "transmutation"`. We need to ensure it returns `mentorSuggestion` pointing to `storybreaker_mentor` at the appropriate time.

### 5.2 chat-mentor Pattern Detection

The `chat-mentor` function already handles `[PATTERN_READY]` marker extraction (added in previous implementation). Ensure Storybreaker mentor responses with this marker are properly cleaned and returned as `patternDetection` field.

---

## Part 6: Success Criteria Checklist

| Criterion | Verification |
|-----------|--------------|
| Initiation card lives in Transmutation Console | Check `TransmutationCouncil.tsx` for state-aware card |
| Transmutation Council flow runs unchanged | Test multi-mentor banter and perspectives |
| Handoff to Storybreaker happens naturally | Verify `mentorSuggestion` after 2-3 exchanges |
| Storybreaker reliably populates Pattern Map | Check `[PATTERN_READY]` JSON extraction |
| Emotions and Fears exist as Pattern Map nodes | Verify 8-node map renders correctly |
| Winning Card unlocks consistently | Test `showPatternCard` trigger on pattern detection |
| Transmutation and Gold phases activate cleanly | Navigate to BecomingTransmutation after card acceptance |
| Inner Self Console remains purely reflective | Verify simplified introduction, no initiation flow |

---

## Part 7: Technical Dependencies

No new packages required. Changes use existing:
- `@/hooks/useInnerPatterns`
- `@/components/pattern-map`
- `supabase.functions.invoke`
- React state management

---

## Part 8: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing council flow | Keep council-meeting logic unchanged; only add handoff suggestion |
| Pattern extraction inconsistency | Use explicit JSON format with `[PATTERN_READY]` marker |
| Raw JSON visible to user | Clean response in edge function before returning |
| Pattern Map node layout issues | Test 8-node radial layout with updated angles |
