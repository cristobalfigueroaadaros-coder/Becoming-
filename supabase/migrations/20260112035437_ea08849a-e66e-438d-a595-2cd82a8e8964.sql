-- Recreate leaderboard_stats view with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    COALESCE(udn.display_name, substring((p.id)::text, 1, 8)) AS display_name,
    COALESCE(p.future_self_avatar, '👤'::text) AS avatar,
    COALESCE(fsp.global_xp, 0) AS total_xp,
    COALESCE(fsp.evolution_level, 1) AS level,
    (SELECT count(*) FROM user_achievements WHERE user_achievements.user_id = p.id) AS achievement_count,
    COALESCE((SELECT max(daily_rituals.streak_count) FROM daily_rituals WHERE daily_rituals.user_id = p.id), 0) AS max_streak,
    (SELECT count(*) FROM tasks WHERE tasks.user_id = p.id AND tasks.status = 'done') AS completed_tasks,
    (SELECT count(*) FROM shadow_encounters WHERE shadow_encounters.user_id = p.id AND shadow_encounters.status = 'completed') AS shadows_faced,
    p.created_at AS joined_at
FROM profiles p
LEFT JOIN future_self_progress fsp ON fsp.user_id = p.id
LEFT JOIN user_display_names udn ON udn.user_id = p.id;

-- Recreate user_energetic_summary view with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_energetic_summary;

CREATE VIEW public.user_energetic_summary
WITH (security_invoker = true)
AS
SELECT 
    user_id,
    count(*) FILTER (WHERE energetic_frequency = 'expansion') AS expansion_dots,
    count(*) FILTER (WHERE energetic_frequency = 'contraction') AS contraction_dots,
    count(*) FILTER (WHERE flow_state_detected = true) AS flow_dots,
    count(*) FILTER (WHERE intuition_signal = true) AS intuition_dots,
    avg(resonance_level) AS avg_resonance,
    ((count(*) FILTER (WHERE energetic_frequency = 'expansion'))::double precision / NULLIF(count(*), 0)::double precision) * 100 AS expansion_percentage
FROM insight_dots
WHERE energetic_frequency IS NOT NULL
GROUP BY user_id;