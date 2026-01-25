-- Add missing mentor types to the mentor_type enum
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'problem_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'inner_clarity_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'release_mentor';