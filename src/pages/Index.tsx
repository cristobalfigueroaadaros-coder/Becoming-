import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Heart, MessageCircle, Rocket, Sparkles, Users, Zap, Crown } from "lucide-react";
import bcomingLogo from "@/assets/bcoming-icon.svg";
import { FloatingDots } from "@/components/ui/floating-dots";

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
  const [activeTab, setActiveTab] = useState(0);

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
        "A visual map of everything inside you. Your experiences, passions, aha moments, and gifts become a living picture that only you could have.",
    },
    {
      icon: MessageCircle,
      title: "AI Mentors",
      description:
        "25 mentors from different perspectives, each one seeing a different angle of you. From those, a personalized council of 7 is assembled to guide you, challenge you, and help you shape your project.",
    },
    {
      icon: Rocket,
      title: "Creation Lab",
      description:
        "Where your project becomes reality. Design thinking, daily goals, and business tools that give structure to what you are building and keep you moving forward.",
    },
    {
      icon: Users,
      title: "Creators",
      description:
        "A community of people who are not performing. They are building from their truth and want to help you build from yours.",
    },
  ];

  const phases = [
    {
      title: "Discover",
      body: "You are figuring out who you are. We help you see yourself clearly, connect your dots, understand the gift you carry, and create a first project to start working on it.",
    },
    {
      title: "Grow",
      body: "You have an idea but it's not real yet. We help you shape it, test it, and take it from inside your head to something you can actually build.",
    },
    {
      title: "Build",
      body: "You have a project or a business and you need to move it forward. Find your direction, grow your impact, and connect with the right people.",
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
            <img src={bcomingLogo} alt="Bcoming" className="h-11 w-11 drop-shadow-[0_0_12px_hsl(265_90%_62%/0.4)]" />
            <span className="font-gloock font-bold text-lg text-foreground">Bcoming</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
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
              Start mapping
            </Button>
          </div>
        </div>
      </nav>

      {/* Block 1 — Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            src="/hero-bg.mp4"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration && v.currentTime > v.duration - 2.5) {
                v.currentTime = 0;
                v.play();
              }
            }}
          />
          <div className="absolute inset-0 bg-background/50" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              For the ones who feel it but haven't named it yet.
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-gloock text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-foreground">You've been collecting dots your whole life.</span>
            <br />
            <span className="gradient-text">Now let's build with them.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Bcoming maps everything inside you. Your experiences, your obsessions, your failures, your gifts. All of it becomes a living picture. Then we help you build from it.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="text-lg px-8 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Start mapping <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Block 2 — Pain and Promise */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <FloatingDots count={30} color="167,139,250" minSize={1} maxSize={2} speed={0.6} />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-8"
          >
            We help you move forward.{" "}
            <span className="gradient-text">No matter where you are right now.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6"
          >
            Building something that matters is hard. It's lonely. It's uncertain. And most of the time you don't know what the next step is.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            Bcoming helps you move forward. With structure, with guidance, and with accountability. Wherever you are in your journey.
          </motion.p>
        </div>
      </section>

      {/* Block 3 — Three Phases */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[150px]" />
          <FloatingDots count={25} color="99,102,241" minSize={1} maxSize={2.5} speed={0.5} />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-6"
            >
              Bcoming adapts{" "}
              <span className="gradient-text">to your journey.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              We all have a different path. And we are all at a different place in it. Bcoming adapts to the phase you are in right now and helps you move forward.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -4, borderColor: "rgba(167,139,250,0.4)" }}
                className="p-8 rounded-2xl border border-border/50 bg-card/50 transition-colors duration-300"
              >
                <h3 className="font-gloock text-xl font-bold text-foreground mb-4">{phase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{phase.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 4 — Conscious Creators */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-black">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            src="/creators-bg.mp4"
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <FloatingDots count={20} color="167,139,250" minSize={1} maxSize={2} speed={0.35} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-8"
          >
            We're building{" "}
            <span className="gradient-text">something together.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              Bcoming is building a network of people who are creating with intention. Not just building for growth. Building for impact.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              People who believe the work they put into the world matters. Who want to do it alongside others who feel the same way.
            </p>
            <p className="font-gloock text-xl md:text-2xl font-semibold gradient-text">
              If that's you, you're in the right place. We can change the world together.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Block 5 — What's Inside (tabs) */}
      <section id="features" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <FloatingDots count={45} color="167,139,250" minSize={1} maxSize={3} speed={0.8} />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-8">
                We help you to <span className="gradient-text">WIN</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
                Within your first ten minutes you will have a clear project to work on. One that is based on who you actually are and the phase you are in right now.
              </p>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
                Bcoming is a system purposely designed to move you in the right direction. To help you achieve goals that feel meaningful to you. Not goals someone else gave you. Yours.
              </p>
              <p className="font-gloock text-xl font-semibold text-foreground mb-12">
                Every part of it connects to the others.
              </p>
            </motion.div>

            {/* Tab navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-10"
            >
              {features.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveTab(i)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                      : "border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {f.title}
                </button>
              ))}
            </motion.div>

            {/* Active tab content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-8 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm max-w-2xl mx-auto"
            >
              {(() => {
                const f = features[activeTab];
                const Icon = f.icon;
                return (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-gloock text-2xl font-bold text-foreground mb-3">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                  </>
                );
              })()}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Block 6 — Belief (unchanged) */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[130px]" />
          <FloatingDots count={35} color="139,92,246" minSize={1} maxSize={2.5} speed={0.6} />
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
            <h2 className="font-gloock text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Purpose is not given. It is found by taking action.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              Every experience you have had. Every person you have admired. Every failure that changed your direction. Every obsession you could not explain. All of it is data. All of it is material.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              Bcoming is the system that reads it and shows you what is there. Not what someone else thinks you should build. What only you, with your specific combination of dots, could build.
            </p>
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="font-gloock text-xl font-semibold gradient-text"
            >
              The dots are already there. They are already connecting.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Block 7 — Pricing (unchanged) */}
      <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[130px]" />
          <FloatingDots count={30} color="167,139,250" minSize={1} maxSize={2.5} speed={0.5} />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Simple, honest pricing
              </span>
              <h2 className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-4">
                Support the journey
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Bcoming is free to explore. If it resonates, consider supporting the vision.
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
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative p-8 rounded-2xl border bg-card/30 transition-all duration-300 hover:bg-card/60 hover:shadow-[0_0_30px_rgba(167,139,250,0.15)] ${
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
                  <h3 className="font-gloock text-xl font-bold text-foreground mb-1">{tier.label}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="font-gloock text-3xl font-bold text-foreground">{tier.price}</span>
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

      {/* Block 8 — Final CTA */}
      <section id="vision" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <FloatingDots count={50} color="167,139,250" minSize={1} maxSize={3} speed={0.7} />
        </div>
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
            <h2 className="font-gloock text-3xl md:text-4xl font-bold text-foreground mb-6">
              You already have everything you need to build your dream life.{" "}
              <span className="gradient-text">Let's make it real.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
              Yes, it's going to be hard. Yes, it's going to take time. Yes, it's going to test you.
            </p>
            <p className="text-base text-foreground/70 leading-relaxed max-w-xl mx-auto mb-10">
              But Bcoming is built to support you through every phase. To find your mission and become who you really are.
            </p>
            <Button size="lg" className="text-lg px-10 py-6 glow-purple gap-2" onClick={scrollToAuth}>
              Start mapping <ArrowRight className="w-5 h-5" />
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
              <img src={bcomingLogo} alt="Bcoming" className="h-12 w-12 mx-auto mb-4" />
              <h2 className="font-gloock text-2xl font-bold text-foreground mb-2">
                {isSignUp ? "Start mapping" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp ? "Create your account and place your first dot." : "Continue your journey."}
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
      <div className="py-16 px-6">
        <p className="text-center text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Happiness is not in what you get. It's in who you become.
        </p>
      </div>

      <footer className="py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={bcomingLogo} alt="Bcoming" className="h-6 w-6" />
            <span className="font-gloock font-semibold text-sm text-foreground">Bcoming</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Bcoming.</p>
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
