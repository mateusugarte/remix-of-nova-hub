-- Create lead_channels table for custom channel tags
CREATE TABLE public.lead_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_channels ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_channels
CREATE POLICY "Users can view their own channels" ON public.lead_channels FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own channels" ON public.lead_channels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own channels" ON public.lead_channels FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own channels" ON public.lead_channels FOR DELETE USING (user_id = auth.uid());

-- Add channel_id to inbound_leads
ALTER TABLE public.inbound_leads ADD COLUMN channel_id UUID REFERENCES public.lead_channels(id);

-- Create ad_campaigns table
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'meta',
  status TEXT NOT NULL DEFAULT 'active',
  budget NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_campaigns
CREATE POLICY "Users can view their own campaigns" ON public.ad_campaigns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own campaigns" ON public.ad_campaigns FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own campaigns" ON public.ad_campaigns FOR DELETE USING (user_id = auth.uid());

-- Create campaign_metric_definitions table (user-defined metrics)
CREATE TABLE public.campaign_metric_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_metric_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own metric definitions" ON public.campaign_metric_definitions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own metric definitions" ON public.campaign_metric_definitions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own metric definitions" ON public.campaign_metric_definitions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own metric definitions" ON public.campaign_metric_definitions FOR DELETE USING (user_id = auth.uid());

-- Create campaign_metrics table (daily metrics records)
CREATE TABLE public.campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_metrics
CREATE POLICY "Users can view metrics of their campaigns" ON public.campaign_metrics FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.ad_campaigns WHERE ad_campaigns.id = campaign_metrics.campaign_id AND ad_campaigns.user_id = auth.uid()));
CREATE POLICY "Users can insert metrics for their campaigns" ON public.campaign_metrics FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.ad_campaigns WHERE ad_campaigns.id = campaign_metrics.campaign_id AND ad_campaigns.user_id = auth.uid()));
CREATE POLICY "Users can update metrics of their campaigns" ON public.campaign_metrics FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.ad_campaigns WHERE ad_campaigns.id = campaign_metrics.campaign_id AND ad_campaigns.user_id = auth.uid()));
CREATE POLICY "Users can delete metrics of their campaigns" ON public.campaign_metrics FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.ad_campaigns WHERE ad_campaigns.id = campaign_metrics.campaign_id AND ad_campaigns.user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_metrics_updated_at BEFORE UPDATE ON public.campaign_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();