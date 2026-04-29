import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Zap, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIERS = [
  {
    id: "supporter",
    label: "Early Supporter",
    price: "$10",
    period: "one-time",
    priceId: "price_1TJPhvGjv5uqp0k0kgyo2tSf",
    mode: "payment" as const,
    icon: Heart,
    description: "Support the vision. Get early access forever.",
    color: "from-[hsl(var(--accent))] to-[hsl(38,92%,45%)]",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$12.99",
    period: "/month",
    priceId: "price_1TJPiMGjv5uqp0k0mc0G5c3x",
    mode: "subscription" as const,
    icon: Zap,
    description: "Full access. Cancel anytime.",
    color: "from-[hsl(var(--primary))] to-[hsl(265,90%,50%)]",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$99",
    period: "/year",
    priceId: "price_1TJPiTGjv5uqp0k0rqYLXTYH",
    mode: "subscription" as const,
    icon: Crown,
    description: "Best value. Save 36%.",
    badge: "Best Value",
    color: "from-[hsl(var(--secondary))] to-[hsl(220,95%,45%)]",
  },
];

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
}

export const PaymentModal = ({ open, onClose }: PaymentModalProps) => {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tier: typeof TIERS[0]) => {
    setLoadingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: tier.id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleContinueFree = () => {
    localStorage.setItem("payment_popup_shown", Date.now().toString());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleContinueFree()}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            You're building something real
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Bcoming is built for people like you — creators, thinkers, builders.
            If this resonates, consider supporting the journey.
          </p>
        </div>

        {/* Tiers */}
        <div className="px-6 pb-2 space-y-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <button
                key={tier.id}
                onClick={() => handleCheckout(tier)}
                disabled={!!loadingTier}
                className={`relative w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all duration-200 group text-left ${
                  loadingTier === tier.id ? "opacity-70" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{tier.label}</span>
                    {tier.badge && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">{tier.period}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Free */}
        <div className="px-6 pb-6 pt-2">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground text-sm"
            onClick={handleContinueFree}
          >
            Continue for free →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
