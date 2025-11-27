-- Add new mentor types to the enum
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'discipline_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'marketing_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'scientific_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'alignment_mentor';
ALTER TYPE mentor_type ADD VALUE IF NOT EXISTS 'oracle_mother';