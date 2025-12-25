import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BirthDataCollectorProps {
  onSubmit: (data: { birthName: string; birthDate: string }) => void;
  isLoading?: boolean;
  existingBirthDate?: string | null;
}

export const BirthDataCollector = ({ 
  onSubmit, 
  isLoading = false,
  existingBirthDate 
}: BirthDataCollectorProps) => {
  const [birthName, setBirthName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    existingBirthDate ? new Date(existingBirthDate) : undefined
  );
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthName.trim()) {
      setError("Please enter your full birth name");
      return;
    }

    if (!birthDate) {
      setError("Please select your birth date");
      return;
    }

    onSubmit({
      birthName: birthName.trim(),
      birthDate: format(birthDate, "yyyy-MM-dd"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/20 w-fit">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Discover Your Pattern Profile</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Your birth data helps us personalize guidance, tune pacing, and route mentors 
            intelligently — accelerating your path to action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="birthName">Full Birth Name</Label>
              <Input
                id="birthName"
                placeholder="As it appears on your birth certificate"
                value={birthName}
                onChange={(e) => setBirthName(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Your legal name at birth — this creates your unique pattern signature
              </p>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background/50",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : "Select your birth date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Your Patterns...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Pattern Profile
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground/70">
              We only use this data to personalize your experience.
              <br />
              No mystical claims — just practical signals for action.
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
