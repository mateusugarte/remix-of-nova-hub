import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, Package, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
}

interface MonthlyPlan {
  id: string;
  month: number;
  year: number;
  description: string | null;
  goals: Goal[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  profit_margin: number;
  notes: string | null;
}

interface Sale {
  id: string;
  description: string;
  amount: number;
  sale_date: string;
  product_id: string | null;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function PlanningSection() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('metas');
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [implementations, setImplementations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected period for revenue
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Dialogs
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MonthlyPlan | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string } | null>(null);

  // Form states
  const [planMonth, setPlanMonth] = useState(new Date().getMonth() + 1);
  const [planYear, setPlanYear] = useState(new Date().getFullYear());
  const [planDescription, setPlanDescription] = useState('');
  
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalUnit, setGoalUnit] = useState('unidade');
  
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productNotes, setProductNotes] = useState('');

  const [saleDescription, setSaleDescription] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saleProductId, setSaleProductId] = useState<string>('none');

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMonthlyPlans(),
      fetchProducts(),
      fetchSales(),
      fetchImplementations(),
    ]);
    setLoading(false);
  };

  const fetchMonthlyPlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('monthly_plans')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const plansWithGoals: MonthlyPlan[] = [];
      for (const plan of plans || []) {
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('monthly_plan_id', plan.id);

        plansWithGoals.push({
          ...plan,
          goals: goals || [],
        });
      }

      setMonthlyPlans(plansWithGoals);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchImplementations = async () => {
    try {
      const { data, error } = await supabase
        .from('implementations')
        .select('*');

      if (error) throw error;
      setImplementations(data || []);
    } catch (error) {
      console.error('Error fetching implementations:', error);
    }
  };

  // Calculate revenue by month
  const getRevenueByMonth = () => {
    const revenueData: { month: string; implementations: number; sales: number; total: number }[] = [];

    for (let month = 1; month <= 12; month++) {
      // Implementation value for the month
      const monthImplementations = implementations.filter(impl => {
        const createdDate = new Date(impl.created_at);
        return createdDate.getMonth() + 1 === month && createdDate.getFullYear() === selectedYear;
      });
      const implTotal = monthImplementations.reduce((sum, impl) => sum + (impl.implementation_value || 0), 0);

      // Sales for the month
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() + 1 === month && saleDate.getFullYear() === selectedYear;
      });
      const salesTotal = monthSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

      revenueData.push({
        month: MONTHS[month - 1].substring(0, 3),
        implementations: implTotal,
        sales: salesTotal,
        total: implTotal + salesTotal,
      });
    }

    return revenueData;
  };

  const totalRevenue = getRevenueByMonth().reduce((sum, m) => sum + m.total, 0);

  // Handlers for Monthly Plans
  const handleOpenPlanDialog = (plan?: MonthlyPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanMonth(plan.month);
      setPlanYear(plan.year);
      setPlanDescription(plan.description || '');
    } else {
      setEditingPlan(null);
      setPlanMonth(new Date().getMonth() + 1);
      setPlanYear(new Date().getFullYear());
      setPlanDescription('');
    }
    setShowPlanDialog(true);
  };

  const handleSavePlan = async () => {
    if (!user) return;

    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('monthly_plans')
          .update({ description: planDescription })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Planejamento atualizado!');
      } else {
        const { error } = await supabase
          .from('monthly_plans')
          .insert({
            user_id: user.id,
            month: planMonth,
            year: planYear,
            description: planDescription || null,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Já existe um planejamento para este mês');
            return;
          }
          throw error;
        }
        toast.success('Planejamento criado!');
      }

      setShowPlanDialog(false);
      fetchMonthlyPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar planejamento');
    }
  };

  // Handlers for Goals
  const handleOpenGoalDialog = (planId: string, goal?: Goal) => {
    setSelectedPlanId(planId);
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalTarget(goal.target_value.toString());
      setGoalCurrent(goal.current_value.toString());
      setGoalUnit(goal.unit);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('0');
      setGoalUnit('unidade');
    }
    setShowGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    if (!selectedPlanId || !goalTitle.trim()) return;

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            title: goalTitle,
            target_value: parseFloat(goalTarget) || 0,
            current_value: parseFloat(goalCurrent) || 0,
            unit: goalUnit,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success('Meta atualizada!');
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            monthly_plan_id: selectedPlanId,
            title: goalTitle,
            target_value: parseFloat(goalTarget) || 0,
            current_value: parseFloat(goalCurrent) || 0,
            unit: goalUnit,
          });

        if (error) throw error;
        toast.success('Meta criada!');
      }

      setShowGoalDialog(false);
      fetchMonthlyPlans();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Erro ao salvar meta');
    }
  };

  // Handlers for Products
  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductDescription(product.description || '');
      setProductPrice(product.price.toString());
      setProductCost(product.cost.toString());
      setProductNotes(product.notes || '');
    } else {
      setEditingProduct(null);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductCost('');
      setProductNotes('');
    }
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!user || !productName.trim()) return;

    try {
      const productData = {
        name: productName,
        description: productDescription || null,
        price: parseFloat(productPrice) || 0,
        cost: parseFloat(productCost) || 0,
        notes: productNotes || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...productData, user_id: user.id });

        if (error) throw error;
        toast.success('Produto criado!');
      }

      setShowProductDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  // Handlers for Sales
  const handleOpenSaleDialog = () => {
    setSaleDescription('');
    setSaleAmount('');
    setSaleDate(format(new Date(), 'yyyy-MM-dd'));
    setSaleProductId('none');
    setShowSaleDialog(true);
  };

  const handleSaveSale = async () => {
    if (!user || !saleDescription.trim()) return;

    try {
      const { error } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          description: saleDescription,
          amount: parseFloat(saleAmount) || 0,
          sale_date: saleDate,
          product_id: saleProductId === 'none' ? null : saleProductId,
        });

      if (error) throw error;
      toast.success('Venda registrada!');
      setShowSaleDialog(false);
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      let table: 'monthly_plans' | 'goals' | 'products' | 'sales' = 'monthly_plans';
      switch (deleteItem.type) {
        case 'plan':
          table = 'monthly_plans';
          break;
        case 'goal':
          table = 'goals';
          break;
        case 'product':
          table = 'products';
          break;
        case 'sale':
          table = 'sales';
          break;
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;
      toast.success('Item excluído!');
      setDeleteItem(null);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const revenueData = getRevenueByMonth();

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        </TabsList>

        {/* Monthly Goals Tab */}
        <TabsContent value="metas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">Planejamentos Mensais</h2>
              <p className="text-sm text-muted-foreground">Defina metas e acompanhe seu progresso</p>
            </div>
            <Button onClick={() => handleOpenPlanDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Mês
            </Button>
          </div>

          <div className="grid gap-6">
            <AnimatePresence>
              {monthlyPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {MONTHS[plan.month - 1]} {plan.year}
                          </CardTitle>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPlanDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'plan', id: plan.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Goals */}
                      <div className="space-y-3">
                        {plan.goals.map(goal => {
                          const progress = goal.target_value > 0
                            ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                            : 0;

                          return (
                            <div key={goal.id} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{goal.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {goal.current_value} / {goal.target_value} {goal.unit}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleOpenGoalDialog(plan.id, goal)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setDeleteItem({ type: 'goal', id: goal.id })}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="text-xs text-muted-foreground text-right">
                                {progress.toFixed(1)}% concluído
                              </div>
                            </div>
                          );
                        })}

                        {plan.goals.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma meta definida
                          </p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenGoalDialog(plan.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Meta
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {monthlyPlans.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum planejamento criado</p>
                  <Button className="mt-4" onClick={() => handleOpenPlanDialog()}>
                    Criar primeiro planejamento
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="produtos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">Produtos</h2>
              <p className="text-sm text-muted-foreground">Gerencie seus produtos e margens</p>
            </div>
            <Button onClick={() => handleOpenProductDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="card-hover h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenProductDialog(product)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteItem({ type: 'product', id: product.id })}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="ml-2 font-medium">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Custo:</span>
                          <span className="ml-2">
                            R$ {product.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Margem:</span>
                        <span className={`ml-2 font-medium ${product.profit_margin >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {product.profit_margin.toFixed(1)}%
                        </span>
                      </div>
                      {product.notes && (
                        <p className="text-xs text-muted-foreground pt-2 border-t">{product.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {products.length === 0 && (
              <Card className="border-dashed col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                  <Button className="mt-4" onClick={() => handleOpenProductDialog()}>
                    Cadastrar primeiro produto
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="vendas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">Vendas</h2>
              <p className="text-sm text-muted-foreground">Registre suas vendas mensais</p>
            </div>
            <Button onClick={handleOpenSaleDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {sales.map((sale, index) => {
                const product = products.find(p => p.id === sale.product_id);
                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="card-hover">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{sale.description}</p>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(sale.sale_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                              {product && <span className="ml-2">• {product.name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-success">
                            R$ {sale.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'sale', id: sale.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {sales.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma venda registrada</p>
                  <Button className="mt-4" onClick={handleOpenSaleDialog}>
                    Registrar primeira venda
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">Faturamento Geral</h2>
              <p className="text-sm text-muted-foreground">
                Visão geral das implementações + vendas
              </p>
            </div>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Revenue Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Total ({selectedYear})</p>
                  <p className="text-3xl font-display font-bold">
                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {revenueData.map((_, index) => (
                        <Cell key={index} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {revenueData.filter(m => m.total > 0).map((month, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{MONTHS[index]}</span>
                    <span className="text-lg font-semibold text-primary">
                      R$ {month.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 space-x-4">
                    <span>Impl: R$ {month.implementations.toLocaleString('pt-BR')}</span>
                    <span>Vendas: R$ {month.sales.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Planejamento' : 'Novo Planejamento Mensal'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingPlan && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Select
                    value={planMonth.toString()}
                    onValueChange={(v) => setPlanMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Select
                    value={planYear.toString()}
                    onValueChange={(v) => setPlanYear(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição / Planejamento</label>
              <Textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Descreva o planejamento para este mês..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan}>
              {editingPlan ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título da Meta</label>
              <Input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Ex: Reuniões de vendas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta</label>
                <Input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Atual</label>
                <Input
                  type="number"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade</label>
              <Input
                value={goalUnit}
                onChange={(e) => setGoalUnit(e.target.value)}
                placeholder="reuniões, vendas, R$..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal} disabled={!goalTitle.trim()}>
              {editingGoal ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Descrição do produto (opcional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço (R$)</label>
                <Input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custo (R$)</label>
                <Input
                  type="number"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="Outras informações importantes (opcional)"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={!productName.trim()}>
              {editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={saleDescription}
                onChange={(e) => setSaleDescription(e.target.value)}
                placeholder="Descrição da venda"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Produto (opcional)</label>
              <Select
                value={saleProductId}
                onValueChange={setSaleProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSale} disabled={!saleDescription.trim()}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
