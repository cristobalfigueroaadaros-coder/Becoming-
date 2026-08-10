-- Atlas reference data
-- These rows are required for the Atlas map and its quest selector.  Keep the
-- UUIDs stable so this migration is safe to apply to both new and existing DBs.

INSERT INTO public.atlas_meta_domains (id, name, description, sort_order)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Person', 'Who you are and what has shaped you.', 1),
  ('22222222-2222-4222-8222-222222222222', 'Process', 'How you think, learn, and create.', 2),
  ('33333333-3333-4333-8333-333333333333', 'Product', 'What you are here to build and offer.', 3),
  ('44444444-4444-4444-8444-444444444444', 'Environment', 'The people and world you want to influence.', 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.atlas_clusters (id, name, slug, meta_domain_id, description, state, sort_order)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Life Events', 'life-events', '11111111-1111-4111-8111-111111111111', 'The moments that shaped your direction.', 'available', 1),
  ('10000000-0000-4000-8000-000000000002', 'Passions', 'passions', '11111111-1111-4111-8111-111111111111', 'What gives you energy and aliveness.', 'available', 2),
  ('10000000-0000-4000-8000-000000000003', 'Values', 'values', '11111111-1111-4111-8111-111111111111', 'The principles you choose to live by.', 'available', 3),
  ('10000000-0000-4000-8000-000000000004', 'Natural Talents', 'natural-talents', '11111111-1111-4111-8111-111111111111', 'The abilities that come naturally to you.', 'available', 4),
  ('10000000-0000-4000-8000-000000000005', 'Childhood Signals', 'childhood-signals', '11111111-1111-4111-8111-111111111111', 'Early clues about who you have always been.', 'available', 5),
  ('10000000-0000-4000-8000-000000000006', 'Skills', 'skills', '22222222-2222-4222-8222-222222222222', 'Skills you learned and can use to move forward.', 'available', 6),
  ('10000000-0000-4000-8000-000000000007', 'Aha Moments', 'aha-moments', '22222222-2222-4222-8222-222222222222', 'Realizations that changed how you see things.', 'available', 7),
  ('10000000-0000-4000-8000-000000000008', 'Experiments', 'experiments', '22222222-2222-4222-8222-222222222222', 'Things you tried, built, and learned from.', 'available', 8),
  ('10000000-0000-4000-8000-000000000009', 'Personal Frustrations', 'personal-frustrations', '22222222-2222-4222-8222-222222222222', 'Problems that matter to you personally.', 'available', 9),
  ('10000000-0000-4000-8000-000000000010', 'External Reflections', 'external-reflections', '22222222-2222-4222-8222-222222222222', 'What other people see and value in you.', 'available', 10),
  ('10000000-0000-4000-8000-000000000011', 'Golden Moments', 'golden-moments', '33333333-3333-4333-8333-333333333333', 'Breakthroughs where your story and strengths connect.', 'available', 11),
  ('10000000-0000-4000-8000-000000000012', 'Ideal Life', 'ideal-life', '33333333-3333-4333-8333-333333333333', 'The life you want to create.', 'available', 12),
  ('10000000-0000-4000-8000-000000000013', 'Vision for a Better World', 'vision-for-a-better-world', '44444444-4444-4444-8444-444444444444', 'The change you want to help create.', 'available', 13),
  ('10000000-0000-4000-8000-000000000014', 'Inspirations', 'inspirations', '44444444-4444-4444-8444-444444444444', 'People, ideas, and examples that guide you.', 'available', 14),
  ('10000000-0000-4000-8000-000000000015', 'Who I Serve', 'who-i-serve', '44444444-4444-4444-8444-444444444444', 'The people you feel called to help.', 'available', 15),
  ('10000000-0000-4000-8000-000000000016', 'How I Create Impact', 'how-i-create-impact', '44444444-4444-4444-8444-444444444444', 'The way your gifts can create change.', 'available', 16)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  meta_domain_id = EXCLUDED.meta_domain_id,
  description = EXCLUDED.description,
  state = EXCLUDED.state,
  sort_order = EXCLUDED.sort_order;
