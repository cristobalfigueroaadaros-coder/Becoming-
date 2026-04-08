import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Sparkles, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { countries } from "@/data/countries";
import { citiesByCountry } from "@/data/cities";

const profileSchema = z.object({
  birth_name: z.string().min(2, "Birth name is required"),
  birth_date: z.date({ required_error: "Birth date is required" }),
  birth_city: z.string().min(1, "City is required"),
  birth_country: z.string().min(1, "Country is required"),
  birth_time: z.string().optional(),
  birth_time_unknown: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const OnboardingStep1 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzingNumerology, setAnalyzingNumerology] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      birth_name: "",
      birth_city: "",
      birth_country: "",
      birth_time: "",
      birth_time_unknown: false,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const birthDateFormatted = format(data.birth_date, "yyyy-MM-dd");
      const birthLocation = `${data.birth_city}, ${data.birth_country}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          birth_name: data.birth_name,
          birth_date: birthDateFormatted,
          birth_time: data.birth_time_unknown ? null : (data.birth_time || null),
          birth_time_unknown: data.birth_time_unknown || false,
          birth_location: birthLocation,
          display_name: data.birth_name.split(' ')[0],
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
          <h1 className="text-4xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground text-lg">
            Let's get to know you a little better
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Pattern Profile</CardTitle>
            <CardDescription>
              This helps us personalize guidance. It does not define you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            if (e.target.value) {
                              const [year, month, day] = e.target.value.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              field.onChange(date);
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birth_country"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birth Country</FormLabel>
                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={countryOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select country"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                  {countries.map((country) => (
                                    <CommandItem
                                      key={country}
                                      value={country}
                                    onSelect={() => {
                                        field.onChange(country);
                                        setCountryOpen(false);
                                        // Reset city when country changes
                                        form.setValue("birth_city", "");
                                        setCustomCityMode(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === country ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {country}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_city"
                    render={({ field }) => {
                      const selectedCountry = form.watch("birth_country");
                      const availableCities = selectedCountry ? (citiesByCountry[selectedCountry] || []) : [];
                      const showCombobox = !customCityMode && availableCities.length > 0;

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Birth City</FormLabel>
                          {showCombobox ? (
                            <>
                              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={cityOpen}
                                      className={cn(
                                        "w-full justify-between font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value || "Select city"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search city..." />
                                    <CommandList>
                                      <CommandEmpty>No city found.</CommandEmpty>
                                      <CommandGroup>
                                        {availableCities.map((city) => (
                                          <CommandItem
                                            key={city}
                                            value={city}
                                            onSelect={() => {
                                              field.onChange(city);
                                              setCityOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === city ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {city}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <CommandGroup>
                                        <CommandItem
                                          onSelect={() => {
                                            setCustomCityMode(true);
                                            setCityOpen(false);
                                            field.onChange("");
                                          }}
                                          className="text-muted-foreground"
                                        >
                                          My city isn't listed...
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </>
                          ) : (
                            <FormControl>
                              <div className="space-y-1">
                                <Input
                                  placeholder={selectedCountry ? "Type your city name" : "Select a country first"}
                                  {...field}
                                />
                                {customCityMode && availableCities.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomCityMode(false);
                                      field.onChange("");
                                    }}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    ← Back to city list
                                  </button>
                                )}
                              </div>
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="birth_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Birth (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            disabled={form.watch("birth_time_unknown")}
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
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-border"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 text-sm text-muted-foreground cursor-pointer">
                          I don't know my birth time
                        </FormLabel>
                      </FormItem>
                    )}
                  />
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
