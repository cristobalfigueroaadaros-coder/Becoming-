import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Plus, Lightbulb } from "lucide-react";

interface BranchAdditionCardProps {
  branchTitle: string;
  branchDescription: string;
  coreTheme: string;
  onAddBranch: (title: string) => void;
  onSaveAsInsight: () => void;
}

export const BranchAdditionCard = ({
  branchTitle,
  branchDescription,
  coreTheme,
  onAddBranch,
  onSaveAsInsight,
}: BranchAdditionCardProps) => {
  const [editedTitle, setEditedTitle] = useState(branchTitle);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBranch = async () => {
    setIsAdding(true);
    await onAddBranch(editedTitle);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-background overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0"
              >
                <GitBranch className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-foreground">Your project is growing</h4>
                <p className="text-sm text-muted-foreground">
                  This complements your focus on "{coreTheme}"
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1.5">Branch Name</p>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-base font-medium border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
                placeholder="Name this branch..."
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {branchDescription}
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveAsInsight}
                disabled={isAdding}
                className="gap-1.5 flex-1"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Keep as insight
              </Button>
              <Button
                size="sm"
                onClick={handleAddBranch}
                disabled={isAdding || !editedTitle.trim()}
                className="gap-1.5 flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAdding ? "Adding..." : "Add to project"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Branches appear in your Project Map
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
