import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Renders text with **bold** markdown keywords as highlighted spans.
 * Keywords are rendered with special styling for emphasis.
 */
export function HighlightedText({ 
  text, 
  className,
  highlightClassName = "font-semibold text-primary"
}: HighlightedTextProps) {
  const parsedContent = useMemo(() => {
    if (!text) return null;
    
    // Split text by **keyword** pattern
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a bolded keyword
      if (part.startsWith("**") && part.endsWith("**")) {
        const keyword = part.slice(2, -2);
        return (
          <strong 
            key={index} 
            className={cn(highlightClassName)}
          >
            {keyword}
          </strong>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  }, [text, highlightClassName]);

  return (
    <span className={cn("whitespace-pre-line", className)}>
      {parsedContent}
    </span>
  );
}

/**
 * Extracts keywords from text that are wrapped in **bold** markers
 */
export function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  
  const matches = text.match(/\*\*([^*]+)\*\*/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(2, -2).toLowerCase());
}

/**
 * Categorizes a keyword based on common patterns
 */
export function categorizeKeyword(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();
  
  // Fear patterns
  const fearPatterns = ["fear", "afraid", "scared", "rejection", "failure", "anxiety", "doubt", "worry", "insecurity"];
  if (fearPatterns.some(p => lowerKeyword.includes(p))) return "fear";
  
  // Bottleneck patterns  
  const bottleneckPatterns = ["consistency", "perfectionism", "overthinking", "procrastination", "stuck", "blocked", "resistance"];
  if (bottleneckPatterns.some(p => lowerKeyword.includes(p))) return "bottleneck";
  
  // Value patterns
  const valuePatterns = ["authenticity", "freedom", "connection", "truth", "integrity", "love", "growth", "impact"];
  if (valuePatterns.some(p => lowerKeyword.includes(p))) return "value";
  
  // Action driver patterns
  const actionPatterns = ["momentum", "accountability", "focus", "discipline", "action", "execution", "commitment"];
  if (actionPatterns.some(p => lowerKeyword.includes(p))) return "action_driver";
  
  // Strategic insight patterns
  const strategicPatterns = ["viral", "potential", "leverage", "positioning", "opportunity", "advantage", "strategy"];
  if (strategicPatterns.some(p => lowerKeyword.includes(p))) return "strategic_insight";
  
  // Default to purpose theme
  return "purpose_theme";
}