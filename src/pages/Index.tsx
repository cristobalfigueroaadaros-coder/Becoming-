import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! Redirecting...");
        // New signups go to Gravity Orientation
        navigate("/gravity/orientation");
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        
        // Check onboarding progress and route appropriately
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("birth_name, gravity_transition_completed, council_introduction_completed, first_project_created_at")
            .eq("id", authData.user.id)
            .single();
          
          if (!profile?.birth_name) {
            // Never started onboarding
            navigate("/onboarding");
          } else if (!profile.gravity_transition_completed) {
            navigate("/gravity/transition");
          } else if (!profile.council_introduction_completed) {
            navigate("/gravity/council-intro");
          } else if (!profile.first_project_created_at) {
            navigate("/gravity/first-project");
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand Side */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-8 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left space-y-6 max-w-lg"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Becoming
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            We become by building.
          </p>
        </motion.div>
      </div>

      {/* Auth Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-muted-foreground">
                  {isSignUp 
                    ? "Begin your journey of becoming" 
                    : "Continue your journey"}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6" 
                  disabled={loading}
                >
                  {loading 
                    ? "..." 
                    : isSignUp 
                      ? "Sign up" 
                      : "Sign in"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
