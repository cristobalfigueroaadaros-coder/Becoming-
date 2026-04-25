import { motion } from "framer-motion";
import type { TimelineEntry } from "@/data/foundersMap";
import { TIMELINE } from "@/data/foundersMap";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<TimelineEntry["tag"], string> = {
  "Life Event": "bg-primary/15 text-primary border-primary/30",
  "Aha Moment": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Skill: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Experiment: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

export const FoundersTimeline = () => {
  return (
    <section className="relative w-full px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            The journey, in time
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every dot was a moment. This is how they connected.
          </p>
        </div>

        {/* Mobile: vertical scroll. Desktop: horizontal scroll. */}
        <div className="md:hidden space-y-3">
          {TIMELINE.map((entry, i) => (
            <TimelineCard entry={entry} index={i} key={`${entry.year}-${entry.title}`} />
          ))}
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto -mx-2 pb-3 scroll-smooth snap-x snap-mandatory">
            <div className="flex gap-4 px-2 min-w-min">
              {TIMELINE.map((entry, i) => (
                <div
                  key={`${entry.year}-${entry.title}`}
                  className="snap-start flex-shrink-0 w-[280px]"
                >
                  <TimelineCard entry={entry} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TimelineCard = ({
  entry,
  index,
}: {
  entry: TimelineEntry;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 h-full"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-muted-foreground">
          {entry.year}
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
            TAG_STYLES[entry.tag],
          )}
        >
          {entry.tag}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-foreground leading-snug">
        {entry.title}
      </h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        {entry.context}
      </p>
    </motion.div>
  );
};