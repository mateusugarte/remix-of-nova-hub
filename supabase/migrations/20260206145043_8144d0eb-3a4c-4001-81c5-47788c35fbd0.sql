
CREATE TABLE public.prospect_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own columns" ON public.prospect_columns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own columns" ON public.prospect_columns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own columns" ON public.prospect_columns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own columns" ON public.prospect_columns FOR DELETE USING (auth.uid() = user_id);
