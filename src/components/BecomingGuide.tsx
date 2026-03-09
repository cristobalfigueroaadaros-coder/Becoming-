import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen, Compass, FlaskConical, Sparkles, Users, TrendingUp,
  ArrowRight, Play, Search, Heart, MessageSquare, Target, Lightbulb,
  LayoutGrid, CalendarCheck, PenTool, Map, DollarSign, Dumbbell,
  Eye, Flame, Zap, RotateCcw, Save, Trophy, BarChart3, Brain,
  ChevronRight, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";
import { cn } from "@/lib/utils";

/* ─── Reusable pieces ─── */

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border-l-2 border-primary p-3 rounded-r-md text-sm text-foreground/90 my-3">
    {children}
  </div>
);

const BeforeAfter = ({ before, after }: { before: string; after: string }) => (
  <div className="grid grid-cols-2 gap-2 my-3">
    <div className="rounded-md border border-border bg-muted/40 p-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">Before</span>
      <p className="text-[11px] text-muted-foreground leading-snug">{before}</p>
    </div>
    <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block mb-1">After</span>
      <p className="text-[11px] text-foreground/80 leading-snug">{after}</p>
    </div>
  </div>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="pt-5 pb-2 px-1">
    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
  </div>
);

interface GuideItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  expandedId: string | null;
  id: string;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

const GuideItem = ({ icon: Icon, title, subtitle, expandedId, id, onToggle, children }: GuideItemProps) => {
  const isOpen = expandedId === id;
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-start gap-3 py-3 px-1 text-left hover:bg-accent/30 rounded-md transition-colors"
      >
        <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{subtitle}</p>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 text-muted-foreground/50 mt-1.5 shrink-0 transition-transform duration-200",
          isOpen && "rotate-90"
        )} />
      </button>
      {isOpen && (
        <div className="pl-11 pr-2 pb-4 text-xs text-muted-foreground leading-relaxed space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

/* ─── Main component ─── */

export const BecomingGuide = () => {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useIntegratorProjects();
  const hasProject = projects && projects.length > 0;

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  // Check if we're on a chat/council page with an input field
  const isChatPage = location.pathname.includes("/council") || 
                     location.pathname.includes("/chat") || 
                     location.pathname.includes("/console-thread");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className={cn(
            "fixed right-4 z-40 rounded-full shadow-lg gap-1.5 px-3 h-9",
            isChatPage ? "bottom-36" : "bottom-24"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-medium">Guide</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[92vw] sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base leading-tight">Becoming Guide</SheetTitle>
              <SheetDescription className="text-[11px] mt-0">Knowledge Base & Guide</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3">
            {/* Sparkle tip */}
            <div className="flex items-start gap-2 mb-3 px-1">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {hasProject
                  ? "You have a project in progress. Keep building and iterating."
                  : "Discover how to turn your ideas into meaningful projects."}
              </p>
            </div>

            {/* Quick Access */}
            <div className="mb-1">
              <span className="text-[11px] font-medium text-muted-foreground/70 px-1">Quick Access</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start gap-1.5" onClick={() => goTo(hasProject ? "/creation-lab" : "/council")}>
                  <Play className="w-3 h-3" />
                  {hasProject ? "Continue Building" : "Getting Started"}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start gap-1.5" onClick={() => goTo("/council")}>
                  <MessageSquare className="w-3 h-3" />
                  Share an Idea
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start gap-1.5" onClick={() => toggle("becoming-loop")}>
                  <RotateCcw className="w-3 h-3" />
                  Understand Cycles
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start gap-1.5" onClick={() => toggle("example-journey")}>
                  <Rocket className="w-3 h-3" />
                  Example Journey
                </Button>
              </div>
            </div>

            {/* ─── FOUNDATION ─── */}
            <SectionLabel label="Foundation" />

            <GuideItem icon={Compass} id="what-is-becoming" title="What is Becoming" subtitle="Your assistant for building meaningful projects and understanding yourself." expandedId={expandedId} onToggle={toggle}>
              <p>Becoming helps you define and build meaningful projects while understanding yourself and becoming the best version of yourself.</p>
              <p>Personal growth, self-expression, and creation are deeply connected. When you take action and build something real, you learn about your interests, strengths, and patterns.</p>
              <p>The more insights you share, the better the system can support your journey of building, learning, and evolving.</p>
            </GuideItem>

            <GuideItem icon={Heart} id="founder-message" title="Message from the Founder" subtitle="Why Becoming exists — a personal note from Cristobal." expandedId={expandedId} onToggle={toggle}>
              <p>I built Becoming because I believe every person carries a unique gift. Our mission in life is to discover that gift and craft something meaningful from it that has a positive impact on society.</p>
              <p>I believe real happiness comes from creating something that helps others. When we create something meaningful, we find purpose, fulfillment, and the opportunity to build a life aligned with who we truly are.</p>
              <p>Becoming helps you discover your gift, build something meaningful from it, and become the best version of yourself in the process. We are in this together.</p>
              <p className="italic text-foreground/60 pt-1">— Cristobal</p>
            </GuideItem>

            <GuideItem icon={Rocket} id="example-journey" title="Example Journey" subtitle="A typical flow through Becoming — from idea to growth." expandedId={expandedId} onToggle={toggle}>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>You share an idea, insight, or challenge.</li>
                <li>The Council and mentors help you explore and refine it.</li>
                <li>Through the architect process you shape the idea into a project.</li>
                <li>You test the idea in the real world and observe what happens.</li>
                <li>You reflect on what worked and what did not.</li>
                <li>You discover personal patterns and lessons along the way.</li>
                <li>Those lessons transform into knowledge and strengths.</li>
                <li>You improve the idea and test again.</li>
              </ol>
            </GuideItem>

            <GuideItem icon={RotateCcw} id="becoming-loop" title="The Becoming Loop" subtitle="Insight → Build → Test → Learn → Reflect → Improve → Build Again." expandedId={expandedId} onToggle={toggle}>
              <p className="font-medium text-foreground">Insight → Build → Test → Learn → Reflect → Improve → Build Again</p>
              <p>Every meaningful project grows through cycles. You begin with an idea, build something small, test it, observe what happens, reflect, and improve. Every cycle increases clarity, skill, and understanding.</p>
              <Callout>You do not need to understand everything before starting. Just share an idea with the Council and begin.</Callout>
            </GuideItem>

            {/* ─── CREATION LAB ─── */}
            <SectionLabel label="Creation Lab" />

            <GuideItem icon={LayoutGrid} id="cl-project" title="Project" subtitle="Defines what you are building — your project's name and direction." expandedId={expandedId} onToggle={toggle}>
              <p>Here you set the name and direction of the project. It becomes the anchor for all your work inside the Creation Lab.</p>
              <BeforeAfter
                before="A scattered idea with no clear structure or next steps."
                after="A named project with clear direction and an actionable first step."
              />
            </GuideItem>

            <GuideItem icon={CalendarCheck} id="cl-daily-goals" title="Daily Goals" subtitle="Small tasks to move the project forward step by step." expandedId={expandedId} onToggle={toggle}>
              <p>Daily goals are small tasks suggested by the system to move the project forward step by step. You can also add insights or feedback about what worked or didn't.</p>
              <p>This information helps the system learn and identify patterns in your behavior so it can improve future guidance.</p>
              <BeforeAfter
                before="Feeling overwhelmed by everything that needs to be done."
                after="One clear task for today, with the system tracking what you learned."
              />
            </GuideItem>

            <GuideItem icon={PenTool} id="cl-design-thinking" title="Design Thinking" subtitle="Structure and iterate on ideas using a proven process." expandedId={expandedId} onToggle={toggle}>
              <p>A structured process to understand the problem, explore solutions, test assumptions, and iterate. It also helps visualize how the project evolves over time.</p>
              <BeforeAfter
                before="An idea that sounds good but hasn't been tested or validated."
                after="A structured iteration with clear assumptions, tests, and learnings."
              />
            </GuideItem>

            <GuideItem icon={Lightbulb} id="cl-creative-space" title="Creative Space" subtitle="An open canvas where ideas and reflections connect." expandedId={expandedId} onToggle={toggle}>
              <p>An open canvas where ideas, reflections, and observations can be connected. This ensures insights are never lost. Over time it becomes a network of connected knowledge.</p>
              <BeforeAfter
                before="Insights scattered across notes, conversations, and memory."
                after="A visual network of connected ideas growing with every session."
              />
            </GuideItem>

            <GuideItem icon={Map} id="cl-map" title="Map" subtitle="Visualize how your ideas, insights, and structures connect." expandedId={expandedId} onToggle={toggle}>
              <p>Shows how ideas, insights, and structures connect together. Helps you visualize the bigger picture and see how different insights relate to each other.</p>
              <BeforeAfter
                before="Individual ideas that feel disconnected from each other."
                after="A living map revealing patterns and connections across your work."
              />
            </GuideItem>

            <GuideItem icon={DollarSign} id="cl-purpose-to-value" title="Business Plan" subtitle="Transform an idea into a real business or impact opportunity." expandedId={expandedId} onToggle={toggle}>
              <p>Transforms an idea into a real business or impact opportunity. Uses business tools to refine the idea, strengthen its structure, and make it more practical and professional.</p>
              <BeforeAfter
                before="A passion project without a clear path to real-world impact."
                after="A structured business plan with audience, offering, and revenue model."
              />
            </GuideItem>

            {/* ─── BECOMING PATH ─── */}
            <SectionLabel label="Becoming Path" />

            <GuideItem icon={Dumbbell} id="bp-exercises" title="Becoming Exercises" subtitle="Explore yourself through Ikigai, strengths, and future reflection." expandedId={expandedId} onToggle={toggle}>
              <p>Exercises designed to help you explore yourself — including Ikigai, strength discovery, and future reflection. These help you understand motivations, abilities, and direction.</p>
            </GuideItem>

            <GuideItem icon={Eye} id="bp-pattern-discovery" title="Pattern Discovery" subtitle="Identify life events that reveal patterns in your behavior." expandedId={expandedId} onToggle={toggle}>
              <p>Identify meaningful life events or challenging experiences. These often reveal patterns that influence behavior and decisions. Understanding these patterns is the first step toward growth.</p>
              <BeforeAfter
                before="Repeating the same cycles without understanding why."
                after="Clear awareness of the patterns driving your decisions and behavior."
              />
            </GuideItem>

            <GuideItem icon={Flame} id="bp-transmutation" title="Transmutation" subtitle="Transform past experiences into knowledge and strength." expandedId={expandedId} onToggle={toggle}>
              <p>Through reflection and guided questions, you extract lessons from past experiences. These lessons become new perspectives and strengths that fuel your growth.</p>
              <BeforeAfter
                before="Painful past experiences that feel like burdens."
                after="Transformed lessons that became wisdom and inner strength."
              />
            </GuideItem>

            <GuideItem icon={Zap} id="bp-superpowers" title="Superpowers" subtitle="Your most valuable abilities — born from challenges and growth." expandedId={expandedId} onToggle={toggle}>
              <p>Challenges and patterns often become the source of our most valuable abilities. Superpowers make these strengths visible so you can use them intentionally.</p>
              <BeforeAfter
                before="Hidden strengths you don't recognize or know how to use."
                after="Named superpowers you can consciously apply to your projects and life."
              />
            </GuideItem>

            {/* ─── COUNCIL ─── */}
            <SectionLabel label="Council" />

            <GuideItem icon={Users} id="council-main" title="Council" subtitle="Explore ideas through mentor conversations in threads." expandedId={expandedId} onToggle={toggle}>
              <p>The Council allows you to explore ideas through mentor conversations. All conversations happen inside threads. Each thread represents an idea, challenge, or project.</p>
              <p>Inside a thread, mentors provide perspectives and may discuss ideas between themselves. The conversation gradually narrows toward the next step.</p>
            </GuideItem>

            <GuideItem icon={Save} id="council-save" title="Save Button" subtitle="Save insights to Creative Space or continue exploring later." expandedId={expandedId} onToggle={toggle}>
              <p>When you press Save you have two options: add the insight to Creative Space or continue exploring later with the mentor.</p>
              <p>If the insight is saved for later exploration, the mentor can send a follow-up message to continue the conversation. You can also speak one-to-one with a specific mentor.</p>
              <Callout>The Save button is how insights move from conversations into your knowledge base. Use it whenever something resonates.</Callout>
            </GuideItem>

            {/* ─── MOMENTUM ─── */}
            <SectionLabel label="Momentum" />

            <GuideItem icon={Trophy} id="momentum-sprint" title="Weekly Sprint" subtitle="Review what worked this week and plan the next one." expandedId={expandedId} onToggle={toggle}>
              <p>Review what worked this week and what did not. This reflection helps improve the plan for the next week.</p>
            </GuideItem>

            <GuideItem icon={BarChart3} id="momentum-accumulated" title="Accumulated Work" subtitle="Long-term progress and the evolution of your project." expandedId={expandedId} onToggle={toggle}>
              <p>Shows long-term progress and the evolution of your project over time. See how far you've come and where the momentum is building.</p>
            </GuideItem>

            <GuideItem icon={Brain} id="momentum-capabilities" title="Capabilities" subtitle="Hard skills and abilities you develop throughout the journey." expandedId={expandedId} onToggle={toggle}>
              <p>Tracks the hard skills and capabilities you develop throughout the journey. As you build and learn, your capability map grows.</p>
            </GuideItem>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-6 mb-4">Momentum unlocks after 7 days of activity</p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
