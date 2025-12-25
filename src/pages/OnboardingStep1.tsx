import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";

const futureSelfSchema = z.object({
  future_age: z.number().min(18).max(150),
  future_location: z.string().min(1, "Location is required"),
  future_lifestyle: z.string().max(100, "Keep it to one short sentence"),
  main_mission: z.string().max(100, "Keep it to one short sentence"),
  birth_name: z.string().min(2, "Birth name is required"),
  birth_date: z.date({ required_error: "Birth date is required" }),
});

type FutureSelfFormData = z.infer<typeof futureSelfSchema>;

const OnboardingStep1 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzingNumerology, setAnalyzingNumerology] = useState(false);

  const form = useForm<FutureSelfFormData>({
    resolver: zodResolver(futureSelfSchema),
    defaultValues: {
      future_age: 35,
      future_location: "",
      future_lifestyle: "",
      main_mission: "",
      birth_name: "",
    },
  });

  const onSubmit = async (data: FutureSelfFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const birthDateFormatted = format(data.birth_date, "yyyy-MM-dd");

      // Save profile first
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          future_age: data.future_age,
          future_location: data.future_location,
          future_lifestyle: data.future_lifestyle,
          main_mission: data.main_mission,
          birth_name: data.birth_name,
          birth_date: birthDateFormatted,
          display_name: data.birth_name.split(' ')[0], // Use first name as display name
        });

      if (profileError) throw profileError;

      const { error: progressError } = await supabase
        .from("future_self_progress")
        .upsert({
          user_id: user.id,
          evolution_level: 1,
          global_xp: 0,
        });

      if (progressError) throw progressError;

      // Auto-run numerology analysis
      setAnalyzingNumerology(true);
      try {
        const { data: numerologyData, error: numerologyError } = await supabase.functions.invoke(
          'analyze-numerology',
          {
            body: {
              birthName: data.birth_name,
              birthDate: birthDateFormatted,
            },
          }
        );

        if (!numerologyError && numerologyData) {
          // Save numerology results to profile
          await supabase
            .from("profiles")
            .update({
              numerology_profile: numerologyData.profile,
              numerology_signals: numerologyData.systemIntelligence,
            })
            .eq("id", user.id);
        }
      } catch (numError) {
        console.error("Numerology analysis failed (non-blocking):", numError);
        // Don't block onboarding if numerology fails
      }

      toast.success("Profile created!");
      navigate("/onboarding/step2");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setAnalyzingNumerology(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-4xl font-bold">Your Future Self Profile</h1>
          <p className="text-muted-foreground text-lg">
            Let's paint a light picture of where you're heading
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>10 Years From Now</CardTitle>
            <CardDescription>Quick snapshot of your future vision</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="future_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Future Age (Your age + 10 years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="35"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="future_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bali, Tokyo, New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="future_lifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Future Lifestyle (1 short sentence)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Living by the ocean, running my own business"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="main_mission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Mission (1 short sentence)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Helping people find their purpose through coaching"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <div className="mb-4">
                    <h3 className="font-medium mb-1">Your Pattern Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      This helps us personalize guidance, tune pacing, and route mentors intelligently.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="birth_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Birth Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your legal name at birth" 
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            As it appears on your birth certificate
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              max={format(new Date(), "yyyy-MM-dd")}
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {analyzingNumerology ? "Analyzing patterns..." : "Saving..."}
                    </>
                  ) : (
                    "Continue →"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingStep1;
