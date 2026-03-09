import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type PostType = "creating" | "working_on_self" | "looking_for_help" | "offering_help";
export type ResonanceType = "inspires_me" | "creating_similar" | "want_to_help" | "needed_this";

export interface CreatorPost {
  id: string;
  user_id: string;
  statement: string;
  post_type: PostType;
  goal: string | null;
  next_step: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export interface CreatorUpdate {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CreatorResonance {
  id: string;
  post_id: string;
  user_id: string;
  resonance_type: ResonanceType;
  created_at: string;
}

export interface CreatorComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export function useCreatorPosts() {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const postsQuery = useQuery({
    queryKey: ["creator-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch profile data separately
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return (data || []).map(p => ({
        ...p,
        profiles: profileMap.get(p.user_id) || null,
      })) as CreatorPost[];
    },
  });

  const postCountQuery = useQuery({
    queryKey: ["creator-post-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("creator_posts")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: { statement: string; post_type: PostType; goal?: string; next_step?: string; location?: string; image_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("creator_posts")
        .insert({ ...post, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-posts"] });
      queryClient.invalidateQueries({ queryKey: ["creator-post-count"] });
    },
  });

  // Resonances
  const useResonances = (postId: string) => {
    return useQuery({
      queryKey: ["creator-resonances", postId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("creator_resonances")
          .select("*")
          .eq("post_id", postId);
        if (error) throw error;
        return data as CreatorResonance[];
      },
    });
  };

  const toggleResonance = useMutation({
    mutationFn: async ({ postId, resonanceType }: { postId: string; resonanceType: ResonanceType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("creator_resonances")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("resonance_type", resonanceType)
        .maybeSingle();

      if (existing) {
        await supabase.from("creator_resonances").delete().eq("id", existing.id);
      } else {
        await supabase.from("creator_resonances").insert({ post_id: postId, user_id: user.id, resonance_type: resonanceType });
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["creator-resonances", postId] });
    },
  });

  // Updates
  const useUpdates = (postId: string) => {
    return useQuery({
      queryKey: ["creator-updates", postId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("creator_updates")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return data as CreatorUpdate[];
      },
    });
  };

  const addUpdate = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("creator_updates").insert({ post_id: postId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["creator-updates", postId] });
    },
  });

  // Comments
  const useComments = (postId: string) => {
    return useQuery({
      queryKey: ["creator-comments", postId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("creator_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const userIds = [...new Set((data || []).map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        return (data || []).map(c => ({
          ...c,
          profiles: profileMap.get(c.user_id) || null,
        })) as CreatorComment[];
      },
    });
  };

  const addComment = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("creator_comments").insert({ post_id: postId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["creator-comments", postId] });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("creators-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "creator_posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["creator-posts"] });
        queryClient.invalidateQueries({ queryKey: ["creator-post-count"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "creator_resonances" }, () => {
        queryClient.invalidateQueries({ queryKey: ["creator-resonances"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "creator_comments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["creator-comments"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return {
    posts: postsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    creatorCount: postCountQuery.data ?? 0,
    currentUserId,
    createPost,
    toggleResonance,
    addUpdate,
    addComment,
    useResonances,
    useUpdates,
    useComments,
  };
}
