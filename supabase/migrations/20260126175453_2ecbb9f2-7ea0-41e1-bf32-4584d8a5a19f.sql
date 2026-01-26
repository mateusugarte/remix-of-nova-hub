-- Create general campaigns table (campaign groups/objectives)
CREATE TABLE public.campaign_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  planning TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key to ad_campaigns linking to campaign_groups
ALTER TABLE public.ad_campaigns 
ADD COLUMN group_id UUID REFERENCES public.campaign_groups(id) ON DELETE CASCADE;

-- Enable RLS on campaign_groups
ALTER TABLE public.campaign_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_groups
CREATE POLICY "Users can view their own campaign groups" 
ON public.campaign_groups FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own campaign groups" 
ON public.campaign_groups FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own campaign groups" 
ON public.campaign_groups FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own campaign groups" 
ON public.campaign_groups FOR DELETE 
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_campaign_groups_updated_at
BEFORE UPDATE ON public.campaign_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();