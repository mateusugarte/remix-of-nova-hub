-- Add budget column to campaign_groups (the "general campaigns")
ALTER TABLE public.campaign_groups 
ADD COLUMN budget numeric DEFAULT 0;

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.campaign_groups.budget IS 'Total budget for all campaigns within this group';