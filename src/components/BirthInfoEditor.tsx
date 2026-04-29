import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarIcon, Star, Edit2, Check, X, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateMockHumanDesignData } from "@/lib/humanDesignDots";

const birthInfoSchema = z.object({
  birth_date: z.date({
    required_error: "Birth date is required",
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

type BirthInfoFormData = z.infer<typeof birthInfoSchema>;

interface BirthInfoEditorProps {
  userId: string;
  initialData?: {
    birth_date: string | null;
    birth_time: string | null;
    birth_location: string | null;
    birth_time_unknown: boolean | null;
  };
  onUpdate?: () => void;
}

export const BirthInfoEditor = ({ userId, initialData, onUpdate }: BirthInfoEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const form = useForm<BirthInfoFormData>({
    resolver: zodResolver(birthInfoSchema),
    defaultValues: {
      birth_date: initialData?.birth_date ? new Date(initialData.birth_date) : undefined,
      birth_time: initialData?.birth_time || "",
      birth_location: initialData?.birth_location || "",
      birth_time_unknown: initialData?.birth_time_unknown || false,
    },
  });

  const birthTimeUnknown = form.watch("birth_time_unknown");

  const onSubmit = async (data: BirthInfoFormData) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          birth_date: format(data.birth_date, "yyyy-MM-dd"),
          birth_time: data.birth_time_unknown ? "12:00" : data.birth_time || null,
          birth_location: data.birth_location || null,
          birth_time_unknown: data.birth_time_unknown,
        })
        .eq("id", userId);

      if (error) throw error;

      // Generate new Human Design data
      const humanDesignData = generateMockHumanDesignData(
        format(data.birth_date, "yyyy-MM-dd"),
        data.birth_time_unknown ? "12:00" : data.birth_time || null,
        data.birth_time_unknown
      );

      // Update profile with new Human Design data
      await supabase
        .from("profiles")
        .update({ 
          human_design_data: humanDesignData as any
        })
        .eq("id", userId);

      toast.success("Birth information updated! Your Human Design chart has been recalculated.");
      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      toast.error("Failed to update birth information", { description: error.message });
    }
  };

  const handleRegenerateChart = async () => {
    if (!initialData?.birth_date) {
      toast.error("Please add your birth date first");
      return;
    }

    setRegenerating(true);
    try {
      const humanDesignData = generateMockHumanDesignData(
        initialData.birth_date,
        initialData.birth_time || null,
        initialData.birth_time_unknown || false
      );

      const { error } = await supabase
        .from("profiles")
        .update({ 
          human_design_data: humanDesignData as any
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Human Design chart regenerated successfully!");
      onUpdate?.();
    } catch (error: any) {
      toast.error("Failed to regenerate chart", { description: error.message });
    } finally {
      setRegenerating(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Human Design Birth Info</CardTitle>
              <CardDescription>
                Update your birth data to recalculate your Human Design chart
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      Required for Human Design calculations
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

              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {form.formState.isSubmitting ? "Saving..." : "Save & Regenerate Chart"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={form.formState.isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Birth Date</Label>
                <p className="text-sm font-medium">
                  {initialData?.birth_date 
                    ? format(new Date(initialData.birth_date), "PPP")
                    : "Not set"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Birth Time</Label>
                <p className="text-sm font-medium">
                  {initialData?.birth_time_unknown 
                    ? "Unknown (using noon)" 
                    : initialData?.birth_time || "Not set"}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Birth Location</Label>
                <p className="text-sm font-medium">
                  {initialData?.birth_location || "Not set"}
                </p>
              </div>
            </div>

            {initialData?.birth_date && (
              <Button
                variant="outline"
                onClick={handleRegenerateChart}
                disabled={regenerating}
                className="w-full"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", regenerating && "animate-spin")} />
                {regenerating ? "Regenerating..." : "Regenerate Human Design Chart"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
