-- Create commercial_metrics table
CREATE TABLE public.commercial_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  comparison_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commercial_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own commercial metrics"
ON public.commercial_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commercial metrics"
ON public.commercial_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commercial metrics"
ON public.commercial_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commercial metrics"
ON public.commercial_metrics FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_commercial_metrics_updated_at
BEFORE UPDATE ON public.commercial_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();