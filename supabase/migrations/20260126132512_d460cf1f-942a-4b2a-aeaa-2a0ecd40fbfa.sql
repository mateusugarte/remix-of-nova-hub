-- Lead Templates table for custom question models
CREATE TABLE public.lead_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add lead scoring and template reference to inbound_leads
ALTER TABLE public.inbound_leads 
  ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.lead_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Enable RLS on lead_templates
ALTER TABLE public.lead_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_templates
CREATE POLICY "Users can view their own lead templates" 
ON public.lead_templates FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own lead templates" 
ON public.lead_templates FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lead templates" 
ON public.lead_templates FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lead templates" 
ON public.lead_templates FOR DELETE 
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_lead_templates_updated_at
BEFORE UPDATE ON public.lead_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();