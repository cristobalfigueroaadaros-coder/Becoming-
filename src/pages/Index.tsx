import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Heart, MessageCircle, Rocket, Sparkles, Star, Users, Zap, Crown } from "lucide-react";
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
      description:
        "Discover and connect your skills, passions, frustrations, and life patterns through guided quests that reveal who you truly are.",
    },
    {
      icon: MessageCircle,
      title: "AI Mentors",
      description:
        "A personalized council of mentors that learns from your journey and guides you with wisdom that actually fits where you are.",
    },
    {
      icon: Rocket,
      title: "Creation Lab",
      description:
        "Turn what you discover into real projects, with structure, tools, and step-by-step guidance to help you build and ship.",
    },
    {
      icon: Users,
      title: "Creators",
      description:
        "Join a growing network of people building from their gifts. Share, connect, and grow together. Because the best things are built in community.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Map",
      description: "Complete guided quests across 13 identity clusters. Your Atlas grows with every insight you claim about who you are.",
    },
    {
      number: "02",
      title: "Shape",
      description: "Your council of 7 AI mentors reads your Atlas and helps you think through what to build, challenge your assumptions, and get clear.",
    },
    {
      number: "03",
      title: "Build",
      description: "Turn clarity into a real project. Set goals, track momentum, and come back each week sharper than before.",
    },
  ];

  const pricingTiers = [
    {
      id: "supporter",
      label: "Early Supporter",
      price: "$10",
      period: "one-time",
      icon: Heart,
      description: "Support the vision. Get early access forever.",
      color: "from-accent to-[hsl(28,95%,52%)]",
    },
    {
      id: "monthly",
      label: "Monthly",
      price: "$12.99",
      period: "/month",
      icon: Zap,
      description: "Full access. Cancel anytime.",
      color: "from-primary to-[hsl(265,90%,50%)]",
    },
    {
      id: "yearly",
      label: "Yearly",
      price: "$99",
      period: "/year",
      icon: Crown,
      description: "Best value. Save 36%.",
      badge: "Best Value",
      color: "from-secondary to-[hsl(220,95%,45%)]",
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
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
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
              Begin for free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary">
              <Sparkles className="w-3.5 h-3.5" />Now in early access
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-sora text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-foreground">You know there's more in you.</span>
            <br />
            <span className="gradient-text">This is how you find it.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Map your identity. Shape it with a personal council of AI mentors who actually know your story. Turn what you discover into a real project with direction, structure, and momentum. Not self-help. A living system.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="text-lg px-8 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Begin for free <ArrowRight className="w-5 h-5" />
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
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="text-sm text-muted-foreground/60 mt-4"
          >
            Free to start. No credit card required.
          </motion.p>
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
              Wherever you are, something feels missing.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Maybe you're just starting and don't know where to go. Maybe you have ideas but can't make them real. Or maybe you're already building but feel stuck and alone in it.
            </p>
            <p className="text-base text-foreground/80 max-w-xl mx-auto mb-12">
              You know there's more. You just need clarity, guidance, and a real place to begin.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { text: "You have talent. You need direction.", icon: "🧭" },
                { text: "You have enough information. You need clarity.", icon: "🔮" },
                { text: "You have drive. You need to know what it's for.", icon: "⚡" },
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
              Where who you are
              <br />
              <span className="gradient-text">becomes what you build.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Bcoming helps you connect your gifts, skills, and life experiences into something real. Through guided exploration and a personal council of AI mentors, your identity stops being a question and starts becoming your greatest asset.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features — Four Pillars */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-sora text-3xl md:text-4xl font-bold text-foreground mb-4">
                From reflection to real creation.
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Each part of Bcoming works together to take you from self-discovery to building something meaningful.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-purple-sm transition-shadow duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-sora text-xl font-bold text-foreground mb-3">{feature.title}</h3>
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
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Your journey adapts to you. Everyone starts somewhere different. Bcoming meets you where you are.
              </p>
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

      {/* Belief Section */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[130px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-sm text-accent mb-6">
              <Heart className="w-3.5 h-3.5" />
              What we believe
            </span>
            <h2 className="font-sora text-3xl md:text-4xl font-bold mb-6 text-foreground">
              We believe every person has a gift.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              Something unique. A way of seeing, creating, or connecting that only you carry.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              We believe real happiness comes from finding that gift, crafting something with it, and offering it back to the world.
            </p>
            <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto mb-6">
              That's why we built Bcoming. Not as a productivity tool. As a space where your gifts become your direction, and your direction becomes your life's work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[130px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Simple, honest pricing
              </span>
              <h2 className="font-sora text-3xl md:text-4xl font-bold text-foreground mb-4">
                Choose your path
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Free to explore. Upgrade when you're ready to go deeper.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className={`relative p-8 rounded-2xl border bg-card/30 transition-all duration-300 hover:bg-card/60 ${
                    tier.badge ? "border-primary/40 hover:border-primary/60" : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {tier.badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-sora text-xl font-bold text-foreground mb-1">{tier.label}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="font-sora text-3xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>
                  </div>
                  <Button className="w-full glow-purple-sm" onClick={scrollToAuth}>
                    Get started
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All features are available for free during early access. Payments are optional and support development.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
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
              Bcoming is not a tool. It's a space where who you are and what you create finally become the same thing. Your gifts are your greatest asset. Let's use them.
            </p>
            <Button size="lg" className="text-lg px-10 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Begin for free <ArrowRight className="w-5 h-5" />
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
                {isSignUp ? "Begin for free" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp ? "Your Atlas is waiting. No credit card required." : "Continue your journey"}
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="mailto:support@bcoming.app" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
