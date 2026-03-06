import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Compass, FlaskConical, Sparkles, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border-l-2 border-primary p-3 rounded-r-md text-sm text-foreground/90 my-2">
    {children}
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AccordionItem value={title} className="border-border/50">
    <AccordionTrigger className="text-sm py-2 hover:no-underline">{title}</AccordionTrigger>
    <AccordionContent className="text-muted-foreground text-xs leading-relaxed space-y-2">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const SectionHeader = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <span className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-primary" />
    {label}
  </span>
);

export const BecomingGuide = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects } = useIntegratorProjects();
  const hasProject = projects && projects.length > 0;

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="fixed bottom-24 right-4 z-40 rounded-full shadow-lg gap-1.5 px-3 h-9"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-medium">Guide</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[92vw] sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg">Becoming Guide</SheetTitle>
          <SheetDescription className="text-xs">Your orientation hub — explore the system at your own pace.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 pb-6">
          {/* Start Here */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2">Start Here</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {hasProject
                ? "You have a project in progress. Keep building and iterating."
                : "If you are new or feeling stuck, share an idea with the Council to begin."}
            </p>
            <Button
              size="sm"
              className="w-full gap-1"
              onClick={() => goTo(hasProject ? "/creation-lab" : "/council")}
            >
              {hasProject ? "Continue Building" : "Start Building"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Callout>
              You do not need to understand everything before starting. Just share an idea with the Council and begin.
            </Callout>
          </div>

          {/* Main accordion */}
          <Accordion type="multiple" className="space-y-0">
            {/* Foundation */}
            <AccordionItem value="foundation" className="border-border/50">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <SectionHeader icon={Compass} label="Foundation" />
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple">
                  <SubSection title="What is Becoming">
                    <p>Becoming is an assistant designed to help you define and build meaningful projects while understanding yourself and becoming the best version of yourself.</p>
                    <p>Personal growth, self-expression, and creation are deeply connected. When you take action and build something real, you learn about your interests, strengths, and patterns.</p>
                    <p>The more insights you share with the system, the better it can support your journey of building, learning, and evolving.</p>
                  </SubSection>
                  <SubSection title="Message from the Founder">
                    <p>I built Becoming because I believe every person carries a unique gift. Our mission in life is to discover that gift and craft something meaningful from it that has a positive impact on society.</p>
                    <p>I believe real happiness comes from creating something that helps others. When we create something meaningful, we find purpose, fulfillment, and the opportunity to build a life aligned with who we truly are.</p>
                    <p>Becoming helps you discover your gift, build something meaningful from it, and become the best version of yourself in the process. We are in this together.</p>
                    <p className="italic text-foreground/70">— Cristobal</p>
                  </SubSection>
                  <SubSection title="Example Journey">
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>You share an idea, insight, or challenge.</li>
                      <li>The Council and mentors help you explore and refine it.</li>
                      <li>Through the architect process you shape the idea into a project.</li>
                      <li>You test the idea in the real world and observe what happens.</li>
                      <li>You reflect on what worked and what did not.</li>
                      <li>You discover personal patterns and lessons along the way.</li>
                      <li>Those lessons transform into knowledge and strengths.</li>
                      <li>You improve the idea and test again.</li>
                    </ol>
                  </SubSection>
                  <SubSection title="The Becoming Loop">
                    <p className="font-medium text-foreground">Insight → Build → Test → Learn → Reflect → Improve → Build Again</p>
                    <p>Every meaningful project grows through cycles. You begin with an idea, build something small, test it, observe what happens, reflect, and improve. Every cycle increases clarity, skill, and understanding.</p>
                  </SubSection>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            {/* Creation Lab */}
            <AccordionItem value="creation-lab" className="border-border/50">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <SectionHeader icon={FlaskConical} label="Creation Lab" />
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground mb-2">The Creation Lab is where ideas become real projects.</p>
                <Accordion type="multiple">
                  <SubSection title="Project">
                    <p>Defines what you are building. Here you set the name and direction of the project.</p>
                  </SubSection>
                  <SubSection title="Daily Goals">
                    <p>Small tasks suggested by the system to move the project forward step by step. You can add insights or feedback about what worked or didn't — this helps the system learn and identify patterns to improve future guidance.</p>
                  </SubSection>
                  <SubSection title="Design Thinking">
                    <p>A structured process to understand the problem, explore solutions, test assumptions, and iterate. It helps visualize how the project evolves over time.</p>
                  </SubSection>
                  <SubSection title="Creative Space">
                    <p>An open canvas where ideas, reflections, and observations can be connected. This ensures insights are never lost. Over time it becomes a network of connected knowledge.</p>
                  </SubSection>
                  <SubSection title="Map">
                    <p>Shows how ideas, insights, and structures connect together. Helps you visualize the bigger picture and see how different insights relate to each other.</p>
                  </SubSection>
                  <SubSection title="Purpose to Value">
                    <p>Transforms an idea into a real business or impact opportunity. Uses business tools to refine the idea, strengthen its structure, and make it more practical and professional.</p>
                  </SubSection>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            {/* Becoming Path */}
            <AccordionItem value="becoming-path" className="border-border/50">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <SectionHeader icon={Sparkles} label="Becoming Path" />
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground mb-2">Focuses on self-understanding and personal growth.</p>
                <Accordion type="multiple">
                  <SubSection title="Becoming Exercises">
                    <p>Exercises designed to help you explore yourself — including Ikigai, strength discovery, and future reflection. These help you understand motivations, abilities, and direction.</p>
                  </SubSection>
                  <SubSection title="Pattern Discovery">
                    <p>Identify meaningful life events or challenging experiences. These often reveal patterns that influence behavior and decisions. Understanding these patterns is the first step toward growth.</p>
                  </SubSection>
                  <SubSection title="Transmutation">
                    <p>Transforms past experiences into knowledge and strength. Through reflection and guided questions you extract lessons from your experiences. These lessons become new perspectives and strengths.</p>
                  </SubSection>
                  <SubSection title="Superpowers">
                    <p>Challenges and patterns often become the source of our most valuable abilities. Superpowers make these strengths visible so you can use them intentionally.</p>
                  </SubSection>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            {/* Council */}
            <AccordionItem value="council" className="border-border/50">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <SectionHeader icon={Users} label="Council" />
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground space-y-2">
                <p>The Council allows you to explore ideas through mentor conversations. All conversations happen inside threads. Each thread represents an idea, challenge, or project.</p>
                <p>Inside a thread, mentors provide perspectives and may discuss ideas between themselves. The conversation gradually narrows toward the next step.</p>
                <Callout>
                  <span className="font-medium text-foreground">Save Button:</span> When you press Save you can add the insight to Creative Space or continue exploring later with the mentor. If saved for later, the mentor can send a follow-up message.
                </Callout>
              </AccordionContent>
            </AccordionItem>

            {/* Momentum */}
            <AccordionItem value="momentum" className="border-border/50">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <SectionHeader icon={TrendingUp} label="Momentum" />
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground mb-2">Momentum unlocks after seven days of activity and a few completed insights or tasks. It analyzes user activity and helps guide progress.</p>
                <Accordion type="multiple">
                  <SubSection title="Weekly Sprint">
                    <p>Review what worked this week and what did not. This reflection helps improve the plan for the next week.</p>
                  </SubSection>
                  <SubSection title="Accumulated Work">
                    <p>Shows long-term progress and the evolution of your project over time.</p>
                  </SubSection>
                  <SubSection title="Capabilities">
                    <p>Tracks the hard skills and capabilities you develop throughout the journey.</p>
                  </SubSection>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-[10px] text-muted-foreground/60 text-center mt-6">Visual examples coming soon</p>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
