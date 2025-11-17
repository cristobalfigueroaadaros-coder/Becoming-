import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Crown, Check } from "lucide-react";
import { toast } from "sonner";

const premiumFeatures = [
  "Unlimited mentor selection",
  "Unlimited council meetings per day",
  "Guided rituals and practices",
  "Deep future self journey modules",
  "Priority AI responses",
  "Export your conversations",
  "Exclusive mentor personalities",
];

const Premium = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    feature: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("premium_waitlist").insert({
        name: formData.name,
        email: formData.email,
        desired_feature: formData.feature,
      });

      if (error) throw error;

      toast.success("You're on the waitlist! We'll be in touch soon.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Crown className="w-10 h-10 text-secondary" />
              Unlock Premium
            </h1>
            <p className="text-muted-foreground mt-2">Take your council to the next level</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Premium Features</CardTitle>
              <CardDescription>Everything you need for deep transformation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Waitlist Form */}
          <Card>
            <CardHeader>
              <CardTitle>Join the Waitlist</CardTitle>
              <CardDescription>
                Be the first to know when premium launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feature">Which premium feature excites you most?</Label>
                  <Textarea
                    id="feature"
                    placeholder="Tell us what you're looking forward to..."
                    value={formData.feature}
                    onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Joining..." : "Join Waitlist"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;
