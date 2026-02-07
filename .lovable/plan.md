
# Transmutation Council: Complete Structure Alignment

## The Root Problem

The **Transmutation Council** uses a **chat message list pattern** (like WhatsApp) while all other councils (**CouncilMeeting**, **BuildersTeam**, **InnerSelfCouncil**) use a **staged card-based UI**.

### Current Transmutation Council (BROKEN):
- Stores everything as `messages[]` (flat chat bubbles)
- Renders perspectives/banter as plain chat bubbles with minimal styling
- No WhatsApp-style alternating layout for banter
- Follow-up question shown as text (`💭 *${question}*`) - **not clickable**
- No proper mentor handoff suggestion card - just a text message
- No "seeking clarity" stage, no "complete" stage

### Working Councils (CouncilMeeting, BuildersTeam, InnerSelfCouncil):
- Uses **stage state**: `'input' | 'seeking_clarity' | 'complete'`
- Uses dedicated state variables:
  - `councilInsight` → Highlighted insight card
  - `mentorPerspectives` → Styled mentor cards
  - `banterLines` → WhatsApp-style alternating chat bubbles with colors
  - `suggestedNextQuestion` → **Clickable card** that prefills input
  - `suggestedMentor` → **Handoff card** with "Continue with X" button
- Clear visual separation between phases

---

## Implementation Plan

### 1. Replace Message-Based Architecture with Stage-Based Architecture

**Remove:**
```tsx
const [messages, setMessages] = useState<Message[]>([]);
```

**Add:**
```tsx
const [stage, setStage] = useState<'input' | 'seeking_clarity' | 'complete'>('input');
const [questionNumber, setQuestionNumber] = useState<number>(0);
const [clarityQuestion, setClarityQuestion] = useState<string>("");
const [councilInsight, setCouncilInsight] = useState<string>("");
const [mentorPerspectives, setMentorPerspectives] = useState<Record<string, string>>({});
const [banterLines, setBanterLines] = useState<Array<{mentor: string; text: string; color: string}>>([]);
const [emotionalReflection, setEmotionalReflection] = useState<string>("");
const [suggestedNextQuestion, setSuggestedNextQuestion] = useState<string | null>(null);
const [suggestedMentor, setSuggestedMentor] = useState<{ targetMentor: string; reason: string } | null>(null);
const [conversationHistory, setConversationHistory] = useState<any[]>([]);
```

### 2. Update handleSubmit to Match Working Councils

Replace the current logic that pushes to `messages[]` with the stage-based pattern:

```tsx
// Handle response from council-meeting
if (data.stage === 'seeking_clarity') {
  setStage('seeking_clarity');
  setClarityQuestion(data.clarityQuestion || "");
  setQuestionNumber(data.questionNumber);
  setQuestion("");
} else {
  setStage('complete');
  setQuestionNumber(data.questionNumber || 0);
  setCouncilInsight(data.councilInsight || "");
  setMentorPerspectives(data.mentorPerspectives || {});
  setBanterLines(data.banterLines || []);
  setEmotionalReflection(data.emotionalReflection || "");
  setSuggestedNextQuestion(data.suggestedNextQuestion || null);
  setSuggestedMentor(data.suggestedMentor || null);
}
```

### 3. Render Complete Stage with Proper Components

Replace the flat message rendering with the structured card layout from BuildersTeam/CouncilMeeting:

**a) Council Insight Card:**
```tsx
{councilInsight && (
  <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
    <CardTitle className="text-sm">✨ Council Insight</CardTitle>
    <HighlightedText text={councilInsight} />
  </Card>
)}
```

**b) Mentor Perspectives (vertical cards):**
```tsx
{Object.entries(mentorPerspectives).map(([mentorType, perspective]) => (
  <Card className="border-l-4 border-l-amber-500/50">
    <div className="flex items-start gap-3">
      <span>{mentorConfig[mentorType].icon}</span>
      <div>
        <p className="font-semibold">{mentorConfig[mentorType].name}</p>
        <HighlightedText text={perspective} />
      </div>
    </div>
  </Card>
))}
```

**c) WhatsApp-Style Banter (alternating sides + colors):**
```tsx
{banterLines.map((line, idx) => {
  const isEven = idx % 2 === 0;
  return (
    <div className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[85%] p-3 rounded-2xl ${isEven ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={{ 
          backgroundColor: `${line.color}15`, 
          borderLeft: isEven ? `3px solid ${line.color}` : undefined,
          borderRight: !isEven ? `3px solid ${line.color}` : undefined,
        }}
      >
        <p className="text-xs font-semibold" style={{ color: line.color }}>
          {mentorConfig[line.mentor]?.icon} {line.mentor}
        </p>
        <HighlightedText text={line.text} />
      </div>
    </div>
  );
})}
```

**d) Clickable Suggested Next Question:**
```tsx
{suggestedNextQuestion && (
  <Card 
    className="border-dashed border-2 cursor-pointer hover:border-amber-500/60"
    onClick={() => continueAsking(suggestedNextQuestion)}
  >
    <p className="text-xs text-muted-foreground">💭 The Council suggests:</p>
    <Button variant="outline" className="w-full">
      {suggestedNextQuestion}
    </Button>
    <p className="text-xs italic">Click to answer</p>
  </Card>
)}
```

**e) Mentor Handoff Suggestion Card:**
```tsx
{suggestedMentor && (
  <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <span>{mentorConfig[suggestedMentor.targetMentor]?.icon}</span>
        <div>
          <p className="font-medium">Want to go deeper?</p>
          <p className="text-xs text-muted-foreground">{suggestedMentor.reason}</p>
        </div>
      </div>
      <Button onClick={() => handleMentorHandoff(suggestedMentor.targetMentor)}>
        Continue with {mentorConfig[suggestedMentor.targetMentor]?.name}
      </Button>
    </div>
  </Card>
)}
```

### 4. Add Seeking Clarity Stage (Q2 Clickable Question)

```tsx
{stage === 'seeking_clarity' && clarityQuestion && (
  <Card className="border-2 border-amber-500/50 bg-amber-500/5">
    <CardTitle>Council Seeking Clarity</CardTitle>
    <p>Before we go deeper, the Council needs to understand:</p>
    <motion.button
      onClick={() => setAnswerDialogOpen(true)}
      className="w-full p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30"
    >
      <MessageCircle />
      <p>{clarityQuestion}</p>
    </motion.button>
    <p className="text-xs">👆 Tap to answer</p>
  </Card>
)}
```

### 5. Add Answer Dialog (for Q2 response)

Copy the Dialog pattern from BuildersTeam:
```tsx
<Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
  <DialogContent>
    <DialogTitle>Your Answer</DialogTitle>
    <Textarea value={currentAnswer} onChange={...} />
    <Button onClick={submitClarityAnswer}>Submit Answer</Button>
  </DialogContent>
</Dialog>
```

### 6. Add Helper Functions

```tsx
const continueAsking = (prefillQuestion?: string) => {
  setStage('input');
  setQuestion(prefillQuestion || "");
  // Clear response state but keep conversationHistory
};

const resetConversation = () => {
  setStage('input');
  setQuestion("");
  setConversationHistory([]);
  // Clear all response state
};
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/TransmutationCouncil.tsx` | Complete rewrite of state management and rendering to match stage-based architecture from other councils |

---

## Summary of Visual Changes

| Element | Before (Broken) | After (Fixed) |
|---------|-----------------|---------------|
| Mentor perspectives | Plain chat bubbles | Styled cards with icons + colored borders |
| Banter | All left-aligned bubbles | WhatsApp-style alternating sides + unique colors |
| Follow-up question | Plain text `💭 *question*` | Clickable card that prefills input |
| Mentor handoff | Text message in chat | Styled card with "Continue with X" button |
| Q2 Clarity question | Not implemented | Clickable card that opens answer dialog |
| Action buttons | None | "Continue Exploring" + "Start New Topic" |
