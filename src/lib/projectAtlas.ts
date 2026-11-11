import { supabase } from "@/integrations/supabase/client";

type ProjectAtlasInput = {
  userId: string;
  projectId: string;
  title: string;
  description?: string | null;
};

type ProjectDotInput = ProjectAtlasInput & {
  dotTitle: string;
  dotDescription: string;
  dotCategory?: string;
  sourceSystem?: string;
  origin?: string;
  dedupe?: boolean;
  signalSources?: Record<string, unknown>;
  signalTags?: Record<string, unknown>;
};

const projectSlug = (projectId: string) => `project-${projectId.slice(0, 8)}`;

export async function ensureProjectAtlasCluster({
  userId,
  projectId,
  title,
  description,
}: ProjectAtlasInput) {
  const slug = projectSlug(projectId);

  const { data: existingCluster } = await supabase
    .from("atlas_clusters")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  const cluster =
    existingCluster ||
    (await supabase
      .from("atlas_clusters")
      .insert({
        name: title,
        slug,
        description: description || `A living Atlas cluster for ${title}.`,
        sort_order: 100,
        cluster_category: "project",
        state: "active",
      })
      .select("id, name")
      .single()).data;

  if (!cluster?.id) return null;

  const { data: existingLinks } = await supabase
    .from("atlas_cluster_project_connections")
    .select("project_id")
    .eq("cluster_id", cluster.id)
    .limit(1);

  if (existingLinks?.[0]?.project_id) {
    return { clusterId: cluster.id, projectNodeId: existingLinks[0].project_id };
  }

  const { data: projectNode } = await supabase
    .from("atlas_project_nodes")
    .insert({
      user_id: userId,
      title,
      description: description || null,
    })
    .select("id")
    .single();

  if (!projectNode?.id) return { clusterId: cluster.id, projectNodeId: null };

  await supabase.from("atlas_cluster_project_connections").insert({
    cluster_id: cluster.id,
    project_id: projectNode.id,
  });

  return { clusterId: cluster.id, projectNodeId: projectNode.id };
}

export async function addProjectAtlasDot({
  userId,
  projectId,
  title,
  description,
  dotTitle,
  dotDescription,
  dotCategory = "project_insight",
  sourceSystem = "project_cluster",
  origin = "auto",
  dedupe = false,
  signalSources = {},
  signalTags = {},
}: ProjectDotInput) {
  const projectAtlas = await ensureProjectAtlasCluster({
    userId,
    projectId,
    title,
    description,
  });

  if (!projectAtlas?.clusterId) return null;

  if (dedupe) {
    const { data: existingDot, error: existingDotError } = await supabase
      .from("atlas_dots")
      .select("id")
      .eq("user_id", userId)
      .eq("cluster_id", projectAtlas.clusterId)
      .eq("dot_category", dotCategory)
      .eq("source_system", sourceSystem)
      .limit(1)
      .maybeSingle();

    if (existingDotError) {
      console.error("Project Atlas dot lookup failed:", existingDotError);
    } else if (existingDot?.id) {
      return existingDot;
    }
  }

  const { data: dot, error } = await supabase
    .from("atlas_dots")
    .insert({
      user_id: userId,
      cluster_id: projectAtlas.clusterId,
      title: dotTitle,
      short_description: dotDescription,
      dot_category: dotCategory,
      dot_type: "project_signal",
      source_system: sourceSystem,
      origin,
      confidence_score: 0.82,
      // Atlas persists strength as an integer on a 0-100 scale.
      signal_strength: 80,
      signal_sources: {
        project_id: projectId,
        project_title: title,
        ...signalSources,
      },
      signal_tags: {
        project_cluster: true,
        auto_populated: true,
        ...signalTags,
      },
    } as any)
    .select("id")
    .single();

  if (error || !dot?.id) {
    console.error("Project Atlas dot creation failed:", error);
    return null;
  }

  if (projectAtlas.projectNodeId) {
    await supabase.from("atlas_dot_project_connections").insert({
      dot_id: dot.id,
      project_id: projectAtlas.projectNodeId,
    });
  }

  return dot;
}

export function ensureProjectAtlasOriginDot(input: ProjectAtlasInput) {
  return addProjectAtlasDot({
    ...input,
    dotTitle: `${input.title} became a project`,
    dotDescription: input.description || "This is the first visible signal in the project cluster.",
    dotCategory: "project_origin",
    sourceSystem: "project_creation",
    origin: "project_created",
    dedupe: true,
    signalTags: { project_origin: true, becoming_loop: true },
  });
}
