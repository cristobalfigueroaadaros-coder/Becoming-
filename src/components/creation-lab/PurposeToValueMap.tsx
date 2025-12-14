import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Target, Users, Sparkles, TrendingUp } from "lucide-react";

interface PurposeToValueMapProps {
  userPurpose: string | null;
}

export const PurposeToValueMap = ({ userPurpose }: PurposeToValueMapProps) => {
  return (
    <div className="space-y-6">
      {/* Coming Soon Card */}
      <Card className="border-dashed border-2 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center mb-6">
            <Lightbulb className="w-10 h-10 text-violet-500" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Purpose to Value Map</h3>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Coming soon: Translate your purpose into something that creates value.
            Define who you serve, what problem you solve, and how it sustains you.
          </p>
          
          {/* Preview of what's coming */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <Target className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Your Purpose</h4>
              <p className="text-xs text-muted-foreground">
                {userPurpose ? "Connected" : "Define your mission"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <Users className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Who You Serve</h4>
              <p className="text-xs text-muted-foreground">Define your audience</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Value Created</h4>
              <p className="text-xs text-muted-foreground">What problem you solve</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <TrendingUp className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Sustainability</h4>
              <p className="text-xs text-muted-foreground">How it sustains you</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Purpose Display */}
      {userPurpose && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Your Current Purpose</h4>
                <p className="text-muted-foreground">{userPurpose}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
