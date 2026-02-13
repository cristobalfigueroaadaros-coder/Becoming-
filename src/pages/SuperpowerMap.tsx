import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Zap } from "lucide-react";
import { useSuperpowers, type Superpower } from "@/hooks/useSuperpowers";
import confetti from "canvas-confetti";

const colorMap: Record<string, string> = {
  amber: "from-amber-400 to-amber-600 shadow-amber-500/30 border-amber-500/40",
  emerald: "from-emerald-400 to-emerald-600 shadow-emerald-500/30 border-emerald-500/40",
  violet: "from-violet-400 to-violet-600 shadow-violet-500/30 border-violet-500/40",
  blue: "from-blue-400 to-blue-600 shadow-blue-500/30 border-blue-500/40",
  rose: "from-rose-400 to-rose-600 shadow-rose-500/30 border-rose-500/40",
  indigo: "from-indigo-400 to-indigo-600 shadow-indigo-500/30 border-indigo-500/40",
};

const getAngle = (index: number, total: number) => {
  return (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
};

const SuperpowerMap = () => {
  const navigate = useNavigate();
  const { superpowers, loading } = useSuperpowers();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (superpowers.length > 0 && !hasAnimated) {
      setHasAnimated(true);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#fbbf24", "#f59e0b", "#a78bfa", "#34d399"],
      });
    }
  }, [superpowers, hasAnimated]);

  // Arrange badges in concentric rings
  const maxPerRing = 6;
  const rings: Superpower[][] = [];
  for (let i = 0; i < superpowers.length; i += maxPerRing) {
    rings.push(superpowers.slice(i, i + maxPerRing));
  }

  // Generate empty slots to encourage completion
  const totalSlots = Math.max(8, superpowers.length + 3);
  const emptySlots = totalSlots - superpowers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/10 via-background to-purple-500/10 p-4 pb-28">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/creation-lab?type=becoming&bmode=transmutation")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Superpower Map
            </h1>
            <p className="text-sm text-muted-foreground">
              {superpowers.length} superpower{superpowers.length !== 1 ? "s" : ""} unlocked
            </p>
          </div>
        </div>

        {/* Motivational banner */}
        {superpowers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-2"
          >
            <p className="text-sm text-amber-500 font-medium">
              Every challenge you overcome becomes your strength ✨
            </p>
          </motion.div>
        )}

        {/* Visual Map */}
        <div className="relative w-full aspect-square max-w-[400px] mx-auto">
          {/* Radial background rings */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute rounded-full border border-amber-500/10"
              style={{
                width: `${ring * 33}%`,
                height: `${ring * 33}%`,
                top: `${50 - (ring * 33) / 2}%`,
                left: `${50 - (ring * 33) / 2}%`,
              }}
            />
          ))}

          {/* Center Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/80 to-purple-500/80 border-2 border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/20 z-10"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>

          {/* Superpower Badges */}
          {superpowers.map((sp, index) => {
            const ringIndex = Math.floor(index / maxPerRing);
            const posInRing = index % maxPerRing;
            const ringTotal = Math.min(maxPerRing, superpowers.length - ringIndex * maxPerRing);
            const radius = 28 + ringIndex * 20;
            const angle = getAngle(posInRing, ringTotal);
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const colors = colorMap[sp.color] || colorMap.amber;

            return (
              <motion.div
                key={sp.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center shadow-lg border text-lg`}
                >
                  {sp.icon}
                </div>
                <span className="text-[10px] text-center text-muted-foreground max-w-[60px] leading-tight">
                  {sp.name}
                </span>
              </motion.div>
            );
          })}

          {/* Empty Slots */}
          {Array.from({ length: emptySlots }).map((_, index) => {
            const totalIndex = superpowers.length + index;
            const ringIndex = Math.floor(totalIndex / maxPerRing);
            const posInRing = totalIndex % maxPerRing;
            const ringTotal = maxPerRing;
            const radius = 28 + ringIndex * 20;
            const angle = getAngle(posInRing, ringTotal);
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <div
                key={`empty-${index}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-dashed border-amber-500/15 flex items-center justify-center"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Zap className="w-4 h-4 text-amber-500/20" />
              </div>
            );
          })}
        </div>

        {/* Superpower List */}
        {superpowers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Your Superpowers</h3>
            {superpowers.map((sp) => {
              const colors = colorMap[sp.color] || colorMap.amber;
              return (
                <motion.div
                  key={sp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center text-lg shadow-md border`}
                  >
                    {sp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{sp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sp.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && superpowers.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-amber-500/50" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Superpowers Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Complete a full transmutation (Black → White → Gold) to unlock your first superpowers.
              </p>
            </div>
            <Button
              onClick={() => navigate("/creation-lab?type=becoming&bmode=transmutation")}
              className="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              Start Transmutation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperpowerMap;
