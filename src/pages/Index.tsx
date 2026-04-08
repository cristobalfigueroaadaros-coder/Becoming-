import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Compass, MessageCircle, Rocket, Sparkles, Star, Zap } from "lucide-react";
import bcomingLogo from "@/assets/bcoming-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Redirecting...");
        navigate("/gravity/orientation");
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select(
              "birth_name, gravity_orientation_completed, gravity_transition_completed, council_introduction_completed, first_project_created_at, onboarding_completion_seen",
            )
            .eq("id", authData.user.id)
            .single();
          if (!profile?.gravity_orientation_completed) navigate("/gravity/orientation");
          else if (!profile?.birth_name) navigate("/onboarding");
          else if (!profile.gravity_transition_completed) navigate("/gravity/transition");
          else if (!profile.council_introduction_completed) navigate("/gravity/council-intro");
          else if (!(profile as any).onboarding_completion_seen) navigate("/gravity/onboarding-complete");
          else if (!profile.first_project_created_at) navigate("/gravity/first-project");
          else navigate("/dashboard");
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

  const scrollToAuth = () => {
    setShowAuth(true);
    setIsSignUp(true);
    setTimeout(() => {
      document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const features = [
    {
      icon: Compass,
      title: "Atlas",
      subtitle: "Map Your Inner World",
      description:
        "Discover your skills, passions, frustrations, and hidden patterns through guided self-exploration quests.",
    },
    {
      icon: MessageCircle,
      title: "AI Mentors",
      subtitle: "Guidance That Knows You",
      description:
        "Five distinct mentor personalities that learn from your journey and guide you with personalized wisdom.",
    },
    {
      icon: Rocket,
      title: "Creation Lab",
      subtitle: "Turn Insight Into Action",
      description:
        "Transform your discoveries into real projects with structured tools, design thinking, and step-by-step execution.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Explore",
      description: "Answer deep questions that reveal your natural gifts, passions, and growth edges.",
    },
    {
      number: "02",
      title: "Discover",
      description: "Watch patterns emerge as the system connects your dots into a living map of who you are.",
    },
    {
      number: "03",
      title: "Create",
      description: "Turn your deepest insights into real projects, guided by AI mentors who truly know you.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={bcomingLogo} alt="Bcoming" className="h-11 w-11 rounded-xl drop-shadow-[0_0_12px_hsl(265_90%_62%/0.4)]" />
            <span className="font-sora font-bold text-lg text-foreground">Bcoming</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#vision" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Vision
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowAuth(true);
                setIsSignUp(false);
                setTimeout(() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
            >
              Log in
            </Button>
            <Button size="sm" className="glow-purple-sm" onClick={scrollToAuth}>
              Start your journey
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary">
              <Sparkles className="w-3.5 h-3.5" />A new way to grow
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-sora text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-foreground">Discover who you are.</span>
            <br />
            <span className="gradient-text">Build what matters.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Bcoming is a transformational platform that helps you uncover your gifts, understand your patterns, and turn
            them into real projects and meaningful paths.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="text-lg px-8 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Start your journey <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-border/50 hover:border-primary/30"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Problem / Emotional Pain */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sora text-3xl md:text-4xl font-bold mb-6 text-foreground">
              You know there's more inside you.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              You have skills, ideas, and a deep sense that you're meant for something bigger. But without clarity, it
              stays trapped — as potential that never becomes real.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { text: "You don't lack talent — you lack a map", icon: "🧭" },
                { text: "You don't need more advice — you need the right guide", icon: "🔮" },
                { text: "You don't need motivation — you need direction", icon: "⚡" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="p-6 rounded-2xl border border-border/50 bg-card/50"
                >
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <p className="text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Bcoming Does */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-sm text-accent mb-6">
              <Star className="w-3.5 h-3.5" />
              What is Bcoming
            </span>
            <h2 className="font-sora text-3xl md:text-4xl font-bold mb-6 text-foreground">
              The space where self-discovery
              <br />
              <span className="gradient-text">becomes creation</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Bcoming connects who you are with what you can build. Through guided exploration, AI mentors, and real
              project tools — your identity becomes your strategy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-sora text-3xl md:text-4xl font-bold text-foreground mb-4">
                Three pillars of transformation
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Each part of Bcoming works together to take you from reflection to reality.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="group relative p-8 rounded-2xl border border-border/50 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all duration-300"
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-purple-sm transition-shadow duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-sora text-xl font-bold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-primary mb-3">{feature.subtitle}</p>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[150px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-sora text-3xl md:text-4xl font-bold text-foreground mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Three steps from curiosity to creation.</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center md:text-left"
              >
                <span className="font-sora text-5xl font-bold gradient-text opacity-60 mb-4 block">{step.number}</span>
                <h3 className="font-sora text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision / Social Proof */}
      <section id="vision" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-sora text-3xl md:text-4xl font-bold text-foreground mb-6">We become by building.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Bcoming is not a tool — it's a transformational space. A place where who you are and what you create
              become the same thing. Your identity is your greatest asset. Let's unlock it.
            </p>
            <Button size="lg" className="text-lg px-10 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Begin your transformation <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="max-w-md mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <img src={bcomingLogo} alt="Bcoming" className="h-12 w-12 mx-auto mb-4 rounded-xl" />
              <h2 className="font-sora text-2xl font-bold text-foreground mb-2">
                {isSignUp ? "Start your journey" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp ? "Create your account and begin exploring" : "Continue your transformation"}
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-muted/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <Button type="submit" className="w-full text-base py-5 glow-purple-sm" disabled={loading}>
                  {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
                </Button>
              </form>

              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={bcomingLogo} alt="Bcoming" className="h-6 w-6 rounded-md" />
            <span className="font-sora font-semibold text-sm text-foreground">Bcoming</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Bcoming. We become by building.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
