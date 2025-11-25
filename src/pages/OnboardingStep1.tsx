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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const futureSelfSchema = z.object({
  future_age: z.number().min(18).max(150),
  future_location: z.string().min(1, "Location is required"),
  future_lifestyle: z.string().max(100, "Keep it to one short sentence"),
  main_mission: z.string().max(100, "Keep it to one short sentence"),
  birth_date: z.date().optional(),
  birth_time: z.string().optional(),
  birth_location: z.string().optional(),
  birth_time_unknown: z.boolean().default(false),
});

type FutureSelfFormData = z.infer<typeof futureSelfSchema>;

const OnboardingStep1 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FutureSelfFormData>({
    resolver: zodResolver(futureSelfSchema),
    defaultValues: {
      future_age: 35,
      future_location: "",
      future_lifestyle: "",
      main_mission: "",
      birth_time_unknown: false,
    },
  });

  const onSubmit = async (data: FutureSelfFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          future_age: data.future_age,
          future_location: data.future_location,
          future_lifestyle: data.future_lifestyle,
          main_mission: data.main_mission,
          birth_date: data.birth_date ? format(data.birth_date, "yyyy-MM-dd") : null,
          birth_time: data.birth_time_unknown ? null : data.birth_time,
          birth_location: data.birth_location,
          birth_time_unknown: data.birth_time_unknown,
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

      toast.success("Future Self profile created!");
      navigate("/onboarding/step2");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                    Human Design (Optional)
                  </h3>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Birth Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_time_unknown"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            I don't know my birth time
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {!form.watch("birth_time_unknown") && (
                      <FormField
                        control={form.control}
                        name="birth_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="birth_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
                  {loading ? "Saving..." : "Continue →"}
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
