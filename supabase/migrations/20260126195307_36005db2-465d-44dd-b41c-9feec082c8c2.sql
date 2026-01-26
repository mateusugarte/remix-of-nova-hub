-- Add flag to identify client-related processes
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS is_client_process BOOLEAN DEFAULT false;

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  notes TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  current_phase_id UUID REFERENCES public.process_tags(id) ON DELETE SET NULL,
  contract_value NUMERIC DEFAULT 0,
  recurrence_value NUMERIC DEFAULT 0,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client payments table
CREATE TABLE public.client_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients" ON public.clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for client_payments
CREATE POLICY "Users can view payments of their clients" ON public.client_payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.clients WHERE clients.id = client_payments.client_id AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert payments for their clients" ON public.client_payments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients WHERE clients.id = client_payments.client_id AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update payments of their clients" ON public.client_payments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.clients WHERE clients.id = client_payments.client_id AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete payments of their clients" ON public.client_payments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.clients WHERE clients.id = client_payments.client_id AND clients.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();