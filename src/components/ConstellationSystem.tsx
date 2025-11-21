import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Lightbulb, Sparkles, Flag, Star, Trash2, Loader2, Network } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EntryType = "book" | "idea" | "insight" | "milestone";

interface ConstellationEntry {
  id: string;
  entry_type: EntryType;
  title: string;
  description: string;
  key_takeaway?: string;
  related_domains?: string[];
  tags?: string[];
  emotional_tone?: string;
  created_at: string;
}

interface Connection {
  id: string;
  entry_ids: string[];
  connection_insight: string;
  pattern_type: string;
  created_at: string;
}

const entryTypeIcons = {
  book: BookOpen,
  idea: Lightbulb,
  insight: Sparkles,
  milestone: Flag,
};

const entryTypeColors = {
  book: "text-blue-500",
  idea: "text-yellow-500",
  insight: "text-purple-500",
  milestone: "text-green-500",
};

const lifeDomains = [
  "Health & Energy",
  "Career & Impact",
  "Relationships & Love",
  "Friends & Community",
  "Creativity & Learning",
  "Spiritual Growth",
];

export const ConstellationSystem = ({ onDataChange }: { onDataChange?: () => void }) => {
  const [entries, setEntries] = useState<ConstellationEntry[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false);
  const [activeTab, setActiveTab] = useState<EntryType>("book");

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: "",
    description: "",
    key_takeaway: "",
    related_domains: [] as string[],
    tags: [] as string[],
    emotional_tone: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load entries
      const { data: entriesData, error: entriesError } = await supabase
        .from("constellation_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;
      setEntries((entriesData || []) as ConstellationEntry[]);

      // Load connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("constellation_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (connectionsError) throw connectionsError;
      setConnections(connectionsData || []);
    } catch (error: any) {
      console.error("Error loading constellation data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("constellation_entries")
        .insert({
          user_id: user.id,
          entry_type: activeTab,
          title: newEntry.title.trim(),
          description: newEntry.description.trim(),
          key_takeaway: newEntry.key_takeaway.trim() || null,
          related_domains: newEntry.related_domains.length > 0 ? newEntry.related_domains : null,
          tags: newEntry.tags.length > 0 ? newEntry.tags : null,
          emotional_tone: newEntry.emotional_tone.trim() || null,
        });

      if (error) throw error;

      toast.success("Entry added to your constellation");
      setAddDialogOpen(false);
      setNewEntry({
        title: "",
        description: "",
        key_takeaway: "",
        related_domains: [],
        tags: [],
        emotional_tone: "",
      });
      loadData();
      onDataChange?.(); // Notify parent
    } catch (error: any) {
      toast.error("Failed to add entry", { description: error.message });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("constellation_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Entry removed");
      loadData();
      onDataChange?.(); // Notify parent
    } catch (error: any) {
      toast.error("Failed to delete entry");
    }
  };

  const analyzePatterns = async () => {
    if (entries.length < 3) {
      toast.error("Add at least 3 entries to discover patterns");
      return;
    }

    setAnalyzingPatterns(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("analyze-constellation", {
        body: { entries: entries.slice(0, 20) } // Limit to last 20 entries for API efficiency
      });

      if (error) throw error;

      if (data?.connections && data.connections.length > 0) {
        toast.success(`Discovered ${data.connections.length} patterns!`, {
          description: "Check the Insights tab to explore them"
        });
        loadData();
        onDataChange?.(); // Notify parent
      } else {
        toast.info("No new patterns discovered yet", {
          description: "Keep adding to your constellation"
        });
      }
    } catch (error: any) {
      console.error("Error analyzing patterns:", error);
      toast.error("Failed to analyze patterns", { description: error.message });
    } finally {
      setAnalyzingPatterns(false);
    }
  };

  const toggleDomain = (domain: string) => {
    setNewEntry(prev => ({
      ...prev,
      related_domains: prev.related_domains.includes(domain)
        ? prev.related_domains.filter(d => d !== domain)
        : [...prev.related_domains, domain]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your constellation...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Star className="w-6 h-6 text-accent" />
                Add to Your Constellation
              </CardTitle>
              <CardDescription className="mt-2">
                Log books, ideas, insights, and milestones to build your personal knowledge constellation.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {entries.length} Entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Add to Constellation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Entry</DialogTitle>
                  <DialogDescription>
                    Capture a moment in your evolution journey
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntryType)}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="book">📚 Book</TabsTrigger>
                    <TabsTrigger value="idea">💡 Idea</TabsTrigger>
                    <TabsTrigger value="insight">✨ Insight</TabsTrigger>
                    <TabsTrigger value="milestone">🎯 Milestone</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder={
                        activeTab === "book" ? "Book title and author" :
                        activeTab === "idea" ? "Brief idea summary" :
                        activeTab === "insight" ? "Key insight" :
                        "Milestone achieved"
                      }
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder={
                        activeTab === "book" ? "What was this book about? Why did you read it?" :
                        activeTab === "idea" ? "Describe your idea in detail" :
                        activeTab === "insight" ? "What did you realize? What clicked?" :
                        "What did you accomplish? How does it feel?"
                      }
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="key-takeaway">Key Takeaway</Label>
                    <Input
                      id="key-takeaway"
                      placeholder="One sentence that captures the essence"
                      value={newEntry.key_takeaway}
                      onChange={(e) => setNewEntry({ ...newEntry, key_takeaway: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Related Life Domains</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {lifeDomains.map(domain => (
                        <Button
                          key={domain}
                          type="button"
                          variant={newEntry.related_domains.includes(domain) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDomain(domain)}
                        >
                          {domain}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emotional-tone">Emotional Tone</Label>
                    <Input
                      id="emotional-tone"
                      placeholder="How did this make you feel? (e.g., excited, challenged, peaceful)"
                      value={newEntry.emotional_tone}
                      onChange={(e) => setNewEntry({ ...newEntry, emotional_tone: e.target.value })}
                    />
                  </div>

                  <Button onClick={addEntry} className="w-full">
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="secondary"
              onClick={analyzePatterns}
              disabled={analyzingPatterns || entries.length < 3}
            >
              {analyzingPatterns ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Network className="w-4 h-4 mr-2" />
                  Connect the Dots
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries and Insights Tabs */}
      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries">Your Entries ({entries.length})</TabsTrigger>
          <TabsTrigger value="insights">AI Insights ({connections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4 mt-4">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Your constellation is waiting to be created</p>
                <p className="text-sm text-muted-foreground">Start by adding books, ideas, insights, or milestones</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => {
                const Icon = entryTypeIcons[entry.entry_type];
                const color = entryTypeColors[entry.entry_type];

                return (
                  <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0", color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{entry.title}</h3>
                              <Badge variant="outline" className="mt-1">
                                {entry.entry_type}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
                          
                          {entry.key_takeaway && (
                            <div className="p-3 bg-accent/10 rounded-lg mb-3">
                              <p className="text-sm font-medium">💎 {entry.key_takeaway}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {entry.related_domains?.map(domain => (
                              <Badge key={domain} variant="secondary" className="text-xs">
                                {domain}
                              </Badge>
                            ))}
                            {entry.emotional_tone && (
                              <Badge variant="outline" className="text-xs">
                                {entry.emotional_tone}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No patterns discovered yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add at least 3 entries, then click "Connect the Dots" to discover insights
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="border-accent/50 bg-accent/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <Network className="w-5 h-5 text-accent mt-1" />
                      <div className="flex-1">
                        <Badge className="mb-2">{connection.pattern_type}</Badge>
                        <p className="text-sm leading-relaxed">{connection.connection_insight}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Connected {connection.entry_ids.length} entries • 
                      {new Date(connection.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
