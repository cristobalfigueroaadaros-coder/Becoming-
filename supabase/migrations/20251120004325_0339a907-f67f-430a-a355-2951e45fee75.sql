-- Add new mentor types to the mentor_type enum
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'business_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'creator_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'mystic_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'heart_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'strategist_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'explorer_mentor';