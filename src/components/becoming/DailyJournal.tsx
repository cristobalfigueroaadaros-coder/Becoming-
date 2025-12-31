import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Save, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";

interface JournalEntry {
  id: string;
  entry_date: string;
  title: string | null;
  content: string;
  detected_emotions: any;
  created_at: string;
}

export const DailyJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_journal")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const entriesData = data || [];
      setEntries(entriesData);
      
      // Check if there's an entry for today
      const today = entriesData.find(e => isToday(parseISO(e.entry_date)));
      if (today) {
        setTodayEntry(today);
        setContent(today.content);
        setTitle(today.title || "");
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Write something first");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");

      if (todayEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("daily_journal")
          .update({
            content: content.trim(),
            title: title.trim() || null,
          })
          .eq("id", todayEntry.id);

        if (error) throw error;
        toast.success("Journal updated");
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("daily_journal")
          .insert({
            user_id: user.id,
            entry_date: today,
            content: content.trim(),
            title: title.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        setTodayEntry(data);
        toast.success("Journal entry saved");
      }

      setIsWriting(false);
      loadEntries();
    } catch (error: any) {
      console.error("Error saving journal:", error);
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleStartWriting = () => {
    if (todayEntry) {
      setContent(todayEntry.content);
      setTitle(todayEntry.title || "");
    } else {
      setContent("");
      setTitle("");
    }
    setIsWriting(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading journal...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Daily Journal
          </CardTitle>
          {!isWriting && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartWriting}
              className="text-amber-500 hover:text-amber-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              {todayEntry ? "Edit Today" : "Write Today"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isWriting ? (
            <motion.div
              key="writing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </div>
              
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-amber-500/20 focus:border-amber-500/50"
              />
              
              <Textarea
                placeholder="What's on your mind? Write freely..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="border-amber-500/20 focus:border-amber-500/50 resize-none"
              />
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWriting(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {entries.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Start your reflection journey
                  </p>
                  <Button
                    onClick={handleStartWriting}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Write First Entry
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                        </span>
                        {isToday(parseISO(entry.entry_date)) && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                            Today
                          </Badge>
                        )}
                      </div>
                      {entry.title && (
                        <h4 className="font-medium text-sm mb-1">{entry.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
