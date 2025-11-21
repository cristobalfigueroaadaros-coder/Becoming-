import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Star, CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Validation schema
const onboardingSchema = z.object({
  future_age: z.coerce
    .number()
    .min(18, "Age must be at least 18")
    .max(120, "Age must be less than 120"),
  future_location: z.string()
    .trim()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be less than 200 characters"),
  future_lifestyle: z.string()
    .trim()
    .min(20, "Please provide more detail about your lifestyle (at least 20 characters)")
    .max(1000, "Lifestyle description must be less than 1000 characters"),
  main_mission: z.string()
    .trim()
    .min(20, "Please provide more detail about your mission (at least 20 characters)")
    .max(1000, "Mission must be less than 1000 characters"),
  emotional_tone: z.string()
    .trim()
    .min(3, "Emotional tone must be at least 3 characters")
    .max(100, "Emotional tone must be less than 100 characters"),
  strength1: z.string()
    .trim()
    .min(2, "Strength must be at least 2 characters")
    .max(100, "Strength must be less than 100 characters"),
  strength2: z.string()
    .trim()
    .min(2, "Strength must be at least 2 characters")
    .max(100, "Strength must be less than 100 characters"),
  strength3: z.string()
    .trim()
    .min(2, "Strength must be at least 2 characters")
    .max(100, "Strength must be less than 100 characters"),
  priority_growth_area: z.string()
    .min(1, "Please select a priority growth area"),
  birth_date: z.date({
    required_error: "Birth date is required for Human Design insights",
  }).refine((date) => date <= new Date(), {
    message: "Birth date cannot be in the future",
  }).refine((date) => date >= new Date("1900-01-01"), {
    message: "Birth date must be after 1900",
  }),
  birth_time: z.string().optional(),
  birth_location: z.string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .optional(),
  birth_time_unknown: z.boolean().default(false),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const OnboardingStep2 = () => {
  const navigate = useNavigate();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      future_age: undefined,
      future_location: "",
      future_lifestyle: "",
      main_mission: "",
      emotional_tone: "",
      strength1: "",
      strength2: "",
      strength3: "",
      priority_growth_area: "",
      birth_date: undefined,
      birth_time: "",
      birth_location: "",
      birth_time_unknown: false,
    },
  });

  const birthTimeUnknown = form.watch("birth_time_unknown");

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        future_age: data.future_age,
        future_location: data.future_location,
        future_lifestyle: data.future_lifestyle,
        main_mission: data.main_mission,
        emotional_tone: data.emotional_tone,
        main_strengths: [data.strength1, data.strength2, data.strength3],
        priority_growth_area: data.priority_growth_area,
        birth_date: format(data.birth_date, "yyyy-MM-dd"),
        birth_time: data.birth_time_unknown ? "12:00" : data.birth_time || null,
        birth_location: data.birth_location || null,
        birth_time_unknown: data.birth_time_unknown,
      });

      // Initialize future_self_progress for the user
      await supabase.from("future_self_progress").insert({
        user_id: user.id,
        global_xp: 0,
        evolution_level: 1,
      });

      if (error) throw error;

      toast.success("Future Self created!");
      navigate("/onboarding-step-3");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-mentor-future to-accent rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Create Your Future Self</h1>
          <p className="text-muted-foreground text-lg">
            Imagine yourself 10 years from now, living your dream life
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Future Self Profile</CardTitle>
            <CardDescription>
              This information will shape how your Future Self mentor speaks to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="future_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Future Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="45"
                          {...field}
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
                        <Input
                          placeholder="Living in Bali, traveling frequently"
                          {...field}
                        />
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
                      <FormLabel>Lifestyle</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your daily life, routines, and how you spend your time..."
                          rows={3}
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
                      <FormLabel>Main Mission</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What are you dedicating your life to? What impact are you making?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emotional_tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotional Tone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Calm, confident, joyful, purposeful..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Three Main Strengths</Label>
                  <FormField
                    control={form.control}
                    name="strength1"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="First strength..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strength2"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Second strength..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strength3"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Third strength..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="priority_growth_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Growth Area</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your priority..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Health and Energy">Health and Energy</SelectItem>
                          <SelectItem value="Career and Impact">Career and Impact</SelectItem>
                          <SelectItem value="Relationships and Love">Relationships and Love</SelectItem>
                          <SelectItem value="Friends and Community">Friends and Community</SelectItem>
                          <SelectItem value="Creativity and Learning">Creativity and Learning</SelectItem>
                          <SelectItem value="Spiritual Growth">Spiritual Growth</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Human Design Section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm">Personalize with Human Design</h3>
                      <p className="text-xs text-muted-foreground">
                        Share your birth info to unlock insights about your energy type, decision-making style, and natural strengths based on Human Design.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birth Date *</FormLabel>
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
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick your birth date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Required for accurate Human Design calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Birth Time {birthTimeUnknown && "(Approximate)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            disabled={birthTimeUnknown}
                            placeholder="Optional but recommended"
                            {...field}
                          />
                        </FormControl>
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
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs text-muted-foreground cursor-pointer">
                            I don't know my birth time (we'll use noon as default)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, Country (e.g., New York, USA)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional but helps with more accurate calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Creating..." : "Complete Onboarding"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingStep2;
