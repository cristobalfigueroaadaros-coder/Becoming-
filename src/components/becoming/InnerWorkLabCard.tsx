import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Orbit, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";

export const InnerWorkLabCard = () => {
  const navigate = useNavigate();
  const { patterns, loading, getExploringPatterns, getTransformedPatterns, getInTransmutationPatterns, getTransmutationStatus } = useInnerPatterns();

  const exploringPatterns = getExploringPatterns();
  const transformedPatterns = getTransformedPatterns();
  const inTransmutationPatterns = getInTransmutationPatterns();

  const getStatusInfo = (pattern: typeof patterns[0]) => {
    const transStatus = getTransmutationStatus(pattern.transmutation_data);
    
    if (pattern.status === "transformed") {
      return { label: "Transmuted", color: "bg-amber-500/20 text-amber-400" };
    }
    if (transStatus.black || transStatus.white) {
      return { label: "In Transmutation", color: "bg-purple-500/20 text-purple-400" };
    }
    return { label: "Exploring", color: "bg-indigo-500/20 text-indigo-400" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Orbit className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                Inner Work Lab
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </CardTitle>
              <CardDescription className="text-sm">
                Make your inner patterns visible and transformable
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : patterns.length > 0 ? (
            <>
              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-muted-foreground">
                    {exploringPatterns.length} exploring
                  </span>
                </div>
                {inTransmutationPatterns.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">
                      {inTransmutationPatterns.length} in progress
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">
                    {transformedPatterns.length} transmuted
                  </span>
                </div>
              </div>

              {/* Recent Patterns */}
              <div className="space-y-2">
                {patterns.slice(0, 3).map((pattern) => {
                  const statusInfo = getStatusInfo(pattern);
                  return (
                    <div
                      key={pattern.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/pattern-map/${pattern.id}`)}
                    >
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm truncate flex-1">
                        {pattern.pattern_name}
                      </span>
                      {pattern.status === 'transformed' && (
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {patterns.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{patterns.length - 3} more patterns
                </p>
              )}

              <Button
                onClick={() => navigate('/inner-self-council')}
                variant="outline"
                className="w-full border-indigo-500/30 hover:bg-indigo-500/10"
              >
                Continue Inner Work
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  When you explore your inner world with the Inner Self Council, 
                  patterns you discover will appear here.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Examples: "I'm not enough", "I freeze when I need to act", 
                  "I always sabotage when it's going well"
                </p>
              </div>

              <Button
                onClick={() => navigate('/inner-self-council')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                Begin Pattern Exploration
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
