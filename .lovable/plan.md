

# Becoming Path Tab Reorganization Plan

## Overview

This plan reorganizes the Becoming Path to match the Creating Project structure with a 4-tab navigation system. The Inner Work Lab's three maps (Pattern, Transmutation, Lifetime) will move from the separate `/pattern-map/:patternId` page into the Becoming Path as tabs.

---

## Current vs. New Structure

| Current (Becoming Path) | New Structure |
|------------------------|---------------|
| Single grid layout with all components | 4 tabs with organized content |
| Pattern Map on separate page (`/pattern-map/:patternId`) | Pattern Map as Tab 2 |
| Transmutation on separate page | Transmutation as Tab 3 |
| Lifetime on separate page | Lifetime as Tab 4 |

---

## New Tab Structure

```
Becoming Path
├── Tab 1: Becoming (Home)
│   ├── ActualSelfSummaryCard (Your Pattern Profile)
│   ├── IdealLifeSnapshot
│   ├── SelfDiscoveryQuests
│   ├── DailyJournal
│   ├── FutureSelfInbox
│   ├── CoreDiscoveries
│   └── LifeDomainsRadar
│
├── Tab 2: Pattern Map
│   ├── Pattern selector (if multiple patterns exist)
│   └── PatternMapCanvas (interactive nodes)
│
├── Tab 3: Transmutation
│   ├── Pattern selector
│   └── TransmutationMapCanvas (Black → White → Gold)
│
└── Tab 4: Lifetime
    └── LifetimeMapTimeline (horizontal timeline)
```

---

## Implementation Steps

### Step 1: Create Becoming Mode Selector Component

**File:** `src/components/creation-lab/BecomingModeSelector.tsx` (NEW)

A new mode selector similar to `ModeSelector.tsx` but for the Becoming Path's 4 tabs:

```typescript
export type BecomingMode = "becoming" | "pattern-map" | "transmutation" | "lifetime";

interface BecomingModeSelectorProps {
  currentMode: BecomingMode;
  onModeChange: (mode: BecomingMode) => void;
  patternCount?: number;
  hasInTransmutation?: boolean;
  hasTransmuted?: boolean;
}
```

**Mode definitions:**
| Mode | Label | Icon | Description |
|------|-------|------|-------------|
| `becoming` | Becoming | User | Your identity journey |
| `pattern-map` | Pattern Map | Orbit | Map your inner patterns |
| `transmutation` | Transmutation | Sparkles | Transform pain into gold |
| `lifetime` | Lifetime | Clock | Your life timeline |

**Visual indicators:**
- Pattern Map tab shows pattern count badge
- Transmutation tab shows sparkle if any transmuted patterns exist
- Color theme: Indigo/Purple gradient (matching Inner Work Lab)

---

### Step 2: Create Pattern Selector Component

**File:** `src/components/creation-lab/PatternSelector.tsx` (NEW)

When users have multiple patterns, they need to select which one to view:

```typescript
interface PatternSelectorProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (patternId: string) => void;
}
```

**Features:**
- Dropdown or horizontal scroll of pattern cards
- Shows pattern name and status badge (Exploring/In Transmutation/Transmuted)
- Auto-selects most recent pattern if none selected
- "Start new pattern" button that navigates to Inner Self Council

---

### Step 3: Refactor BecomingPath Component

**File:** `src/components/creation-lab/BecomingPath.tsx` (MODIFY)

Transform from a single grid layout to a tabbed interface:

```typescript
interface BecomingPathProps {
  initialMode?: BecomingMode;
}

export const BecomingPath = ({ initialMode = "becoming" }: BecomingPathProps) => {
  const [currentMode, setCurrentMode] = useState<BecomingMode>(initialMode);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  
  // Load patterns
  const { patterns, loading, ... } = useInnerPatterns();
  const { events, ... } = useLifetimeEvents();
  
  // Auto-select first pattern
  useEffect(() => {
    if (patterns.length > 0 && !selectedPatternId) {
      setSelectedPatternId(patterns[0].id);
    }
  }, [patterns]);
  
  return (
    <div className="space-y-6">
      {/* Hero Section (same as before) */}
      
      {/* Mode Selector (new 4-tab navigation) */}
      <BecomingModeSelector
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        patternCount={patterns.length}
        hasInTransmutation={inTransmutationPatterns.length > 0}
        hasTransmuted={transformedPatterns.length > 0}
      />
      
      {/* Content based on mode */}
      {currentMode === "becoming" && <BecomingHome />}
      {currentMode === "pattern-map" && (
        <BecomingPatternMap 
          patterns={patterns} 
          selectedPatternId={selectedPatternId}
          onPatternSelect={setSelectedPatternId}
        />
      )}
      {currentMode === "transmutation" && (
        <BecomingTransmutation 
          patterns={patterns}
          selectedPatternId={selectedPatternId}
          onPatternSelect={setSelectedPatternId}
        />
      )}
      {currentMode === "lifetime" && (
        <BecomingLifetime events={events} />
      )}
    </div>
  );
};
```

---

### Step 4: Create BecomingHome Component

**File:** `src/components/creation-lab/BecomingHome.tsx` (NEW)

Extract the current BecomingPath grid into its own component:

```typescript
export const BecomingHome = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-6">
        <FutureSelfInbox />
        <SelfDiscoveryQuests />
        <DailyJournal />
      </div>
      
      {/* Right Column */}
      <div className="space-y-6">
        <ActualSelfSummaryCard />
        <IdealLifeSnapshot />
        <CoreDiscoveries />
        <LifeDomainsRadar />
      </div>
    </div>
  );
};
```

**Note:** Remove `InnerWorkLabCard` from here since the Pattern/Transmutation/Lifetime tabs now serve that purpose directly.

---

### Step 5: Create BecomingPatternMap Component

**File:** `src/components/creation-lab/BecomingPatternMap.tsx` (NEW)

Embed Pattern Map functionality directly in the tab:

```typescript
interface BecomingPatternMapProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (id: string) => void;
}

export const BecomingPatternMap = ({ ... }) => {
  const selectedPattern = patterns.find(p => p.id === selectedPatternId);
  
  return (
    <div className="space-y-6">
      {/* Pattern Selector */}
      {patterns.length > 0 && (
        <PatternSelector 
          patterns={patterns}
          selectedPatternId={selectedPatternId}
          onPatternSelect={onPatternSelect}
        />
      )}
      
      {/* Empty state */}
      {patterns.length === 0 && (
        <EmptyPatternState onStartExploration={() => navigate('/inner-self-council')} />
      )}
      
      {/* Pattern Map Canvas */}
      {selectedPattern && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2>{selectedPattern.pattern_name}</h2>
              <Badge>{selectedPattern.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PatternMapCanvas
              patternName={selectedPattern.pattern_name}
              nodeData={parseNodeData(selectedPattern.life_events)}
              onNodeClick={handleNodeClick}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <Button onClick={() => navigate('/inner-self-council')}>
        Continue with Inner Self Mentor
      </Button>
    </div>
  );
};
```

---

### Step 6: Create BecomingTransmutation Component

**File:** `src/components/creation-lab/BecomingTransmutation.tsx` (NEW)

Embed Transmutation Map functionality:

```typescript
interface BecomingTransmutationProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (id: string) => void;
}

export const BecomingTransmutation = ({ ... }) => {
  const selectedPattern = patterns.find(p => p.id === selectedPatternId);
  const transmutationData = parseTransmutationData(selectedPattern);
  
  return (
    <div className="space-y-6">
      {/* Pattern Selector */}
      <PatternSelector ... />
      
      {/* Empty state if no patterns */}
      {patterns.length === 0 && (
        <Card className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
          <p>Discover a pattern first to begin transmutation</p>
          <Button onClick={() => navigate('/inner-self-council')}>
            Start Pattern Exploration
          </Button>
        </Card>
      )}
      
      {/* Transmutation Map Canvas */}
      {selectedPattern && (
        <TransmutationMapCanvas
          patternName={selectedPattern.pattern_name}
          transmutationData={transmutationData}
          onNodeClick={handleNodeClick}
          isCompleted={selectedPattern.status === 'transformed'}
        />
      )}
      
      {/* Celebration overlay */}
      {showCelebration && (
        <TransmutationCelebration ... />
      )}
    </div>
  );
};
```

---

### Step 7: Create BecomingLifetime Component

**File:** `src/components/creation-lab/BecomingLifetime.tsx` (NEW)

Embed Lifetime Map functionality:

```typescript
interface BecomingLifetimeProps {
  events: LifetimeEvent[];
  eventsByPeriod: Record<TimePeriod, LifetimeEvent[]>;
}

export const BecomingLifetime = ({ events, eventsByPeriod }) => {
  return (
    <div className="space-y-6">
      <LifetimeMapTimeline
        events={events}
        eventsByPeriod={eventsByPeriod}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
      />
      
      {/* Edit/Detail modals */}
      <LifetimeEventEditModal ... />
      <LifetimeEventDetailView ... />
    </div>
  );
};
```

---

### Step 8: Update CreationLab.tsx

**File:** `src/pages/CreationLab.tsx` (MODIFY)

Pass mode through URL params for Becoming Path:

```typescript
// Get becoming mode from URL
const becomingModeParam = searchParams.get("bmode") as BecomingMode | null;

// When rendering Becoming Path
{projectType === "becoming" && (
  <BecomingPath 
    initialMode={becomingModeParam || "becoming"}
  />
)}

// Update URL when mode changes
const handleBecomingModeChange = (mode: BecomingMode) => {
  setSearchParams({ type: "becoming", bmode: mode });
};
```

---

### Step 9: Update Navigation from PatternMap.tsx

**File:** `src/pages/PatternMap.tsx` (MODIFY)

Update "Back" navigation to go to the correct tab:

```typescript
// Instead of navigating to /creation-lab?type=becoming
// Navigate to the specific tab they came from
navigate('/creation-lab?type=becoming&bmode=pattern-map');
```

Keep PatternMap.tsx as a standalone page for direct pattern links but update all "Back" buttons to return to the correct Becoming Path tab.

---

### Step 10: Update InnerWorkLabCard (Optional Removal)

Since the Pattern Map, Transmutation, and Lifetime tabs now exist at the top level of Becoming Path, the `InnerWorkLabCard` can be simplified or removed from `BecomingHome`.

**Option A:** Remove completely (tabs serve the purpose)
**Option B:** Keep as a summary widget that shows quick stats and links to tabs

Recommended: **Option A** - Remove to avoid duplication

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/creation-lab/BecomingModeSelector.tsx` | CREATE | 4-tab mode selector for Becoming Path |
| `src/components/creation-lab/PatternSelector.tsx` | CREATE | Pattern dropdown/selector component |
| `src/components/creation-lab/BecomingHome.tsx` | CREATE | Tab 1 content (current grid layout) |
| `src/components/creation-lab/BecomingPatternMap.tsx` | CREATE | Tab 2 content (pattern map embedded) |
| `src/components/creation-lab/BecomingTransmutation.tsx` | CREATE | Tab 3 content (transmutation embedded) |
| `src/components/creation-lab/BecomingLifetime.tsx` | CREATE | Tab 4 content (lifetime embedded) |
| `src/components/creation-lab/BecomingPath.tsx` | MODIFY | Add mode selector and tab switching |
| `src/pages/CreationLab.tsx` | MODIFY | Pass becoming mode via URL |
| `src/pages/PatternMap.tsx` | MODIFY | Update back navigation |

---

## Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│  Becoming Path    [Edit Purpose]                           │
│  Discover who you are becoming                             │
└────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│  Becoming Path  │  │ Creating Project│
└─────────────────┘  └─────────────────┘
       ↓ (active)

┌──────────┬──────────────┬───────────────┬───────────┐
│ Becoming │  Pattern Map │ Transmutation │ Lifetime  │
│  (Home)  │      (3)     │      ✨       │           │
└──────────┴──────────────┴───────────────┴───────────┘
     ↓ (active tab)

┌────────────────────────┬────────────────────────┐
│  Future Self Inbox     │  Your Pattern Profile  │
│  Self-Discovery Quests │  Ideal Life Snapshot   │
│  Daily Journal         │  Core Discoveries      │
│                        │  Life Domains Radar    │
└────────────────────────┴────────────────────────┘
```

---

## URL Structure

| Tab | URL |
|-----|-----|
| Becoming (Home) | `/creation-lab?type=becoming&bmode=becoming` |
| Pattern Map | `/creation-lab?type=becoming&bmode=pattern-map` |
| Transmutation | `/creation-lab?type=becoming&bmode=transmutation` |
| Lifetime | `/creation-lab?type=becoming&bmode=lifetime` |

---

## Success Criteria

1. Becoming Path shows 4-tab navigation (Becoming, Pattern Map, Transmutation, Lifetime)
2. Tab navigation persists in URL
3. Pattern Map tab shows pattern selector and canvas
4. Transmutation tab shows transmutation canvas with Black/White/Gold phases
5. Lifetime tab shows horizontal timeline
6. All existing functionality works within tabs
7. Navigation between tabs is smooth with animations
8. "Back" buttons from standalone PatternMap page return to correct tab
9. Empty states guide users to Inner Self Council

