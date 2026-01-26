-- Add ICP description field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS icp_description TEXT DEFAULT NULL;