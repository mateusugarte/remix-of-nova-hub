-- Add no_show field to inbound_leads for tracking no-shows
ALTER TABLE public.inbound_leads ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false;