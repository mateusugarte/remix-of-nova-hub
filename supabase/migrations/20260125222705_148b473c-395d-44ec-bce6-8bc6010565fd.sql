-- Tabela de etiquetas para processos
CREATE TABLE public.process_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#93153B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de processos
CREATE TABLE public.processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de fases dos processos
CREATE TABLE public.process_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Relação entre processos e etiquetas
CREATE TABLE public.process_tag_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.process_tags(id) ON DELETE CASCADE,
  UNIQUE(process_id, tag_id)
);

-- Tabela de planejamentos mensais
CREATE TABLE public.monthly_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Tabela de metas
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_plan_id UUID NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'unidade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  profit_margin NUMERIC GENERATED ALWAYS AS (CASE WHEN price > 0 THEN ((price - cost) / price) * 100 ELSE 0 END) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para process_tags
ALTER TABLE public.process_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tags" ON public.process_tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own tags" ON public.process_tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own tags" ON public.process_tags FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own tags" ON public.process_tags FOR DELETE USING (user_id = auth.uid());

-- RLS para processes
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own processes" ON public.processes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own processes" ON public.processes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own processes" ON public.processes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own processes" ON public.processes FOR DELETE USING (user_id = auth.uid());

-- RLS para process_phases
ALTER TABLE public.process_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view phases of their processes" ON public.process_phases FOR SELECT USING (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_phases.process_id AND processes.user_id = auth.uid()));
CREATE POLICY "Users can insert phases for their processes" ON public.process_phases FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_phases.process_id AND processes.user_id = auth.uid()));
CREATE POLICY "Users can update phases of their processes" ON public.process_phases FOR UPDATE USING (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_phases.process_id AND processes.user_id = auth.uid()));
CREATE POLICY "Users can delete phases of their processes" ON public.process_phases FOR DELETE USING (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_phases.process_id AND processes.user_id = auth.uid()));

-- RLS para process_tag_relations
ALTER TABLE public.process_tag_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tag relations of their processes" ON public.process_tag_relations FOR SELECT USING (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_tag_relations.process_id AND processes.user_id = auth.uid()));
CREATE POLICY "Users can insert tag relations for their processes" ON public.process_tag_relations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_tag_relations.process_id AND processes.user_id = auth.uid()));
CREATE POLICY "Users can delete tag relations of their processes" ON public.process_tag_relations FOR DELETE USING (EXISTS (SELECT 1 FROM public.processes WHERE processes.id = process_tag_relations.process_id AND processes.user_id = auth.uid()));

-- RLS para monthly_plans
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own plans" ON public.monthly_plans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own plans" ON public.monthly_plans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own plans" ON public.monthly_plans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own plans" ON public.monthly_plans FOR DELETE USING (user_id = auth.uid());

-- RLS para goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view goals of their plans" ON public.goals FOR SELECT USING (EXISTS (SELECT 1 FROM public.monthly_plans WHERE monthly_plans.id = goals.monthly_plan_id AND monthly_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert goals for their plans" ON public.goals FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.monthly_plans WHERE monthly_plans.id = goals.monthly_plan_id AND monthly_plans.user_id = auth.uid()));
CREATE POLICY "Users can update goals of their plans" ON public.goals FOR UPDATE USING (EXISTS (SELECT 1 FROM public.monthly_plans WHERE monthly_plans.id = goals.monthly_plan_id AND monthly_plans.user_id = auth.uid()));
CREATE POLICY "Users can delete goals of their plans" ON public.goals FOR DELETE USING (EXISTS (SELECT 1 FROM public.monthly_plans WHERE monthly_plans.id = goals.monthly_plan_id AND monthly_plans.user_id = auth.uid()));

-- RLS para products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (user_id = auth.uid());

-- RLS para sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own sales" ON public.sales FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own sales" ON public.sales FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own sales" ON public.sales FOR DELETE USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monthly_plans_updated_at BEFORE UPDATE ON public.monthly_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();