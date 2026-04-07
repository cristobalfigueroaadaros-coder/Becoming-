import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        if (data?.subscribed) {
          setVerified(true);
        } else {
          // Payment might still be processing
          setTimeout(async () => {
            const { data: retry } = await supabase.functions.invoke("check-subscription");
            setVerified(!!retry?.subscribed);
            if (!retry?.subscribed) setError(true);
          }, 3000);
        }
      } catch {
        setError(true);
      }
    };
    verify();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {verified ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Thank you!</h1>
            <p className="text-muted-foreground">
              You're now part of the Bcoming journey. Your support helps build something meaningful.
            </p>
            <Button onClick={() => navigate("/creation-lab")} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Continue Building
            </Button>
          </>
        ) : error ? (
          <>
            <h1 className="text-2xl font-bold text-foreground">Processing...</h1>
            <p className="text-muted-foreground">
              Your payment is being confirmed. You can safely return to the app.
            </p>
            <Button onClick={() => navigate("/creation-lab")}>
              Back to Creation Lab
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Verifying your payment...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
