import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Plus, Trash2, Edit, TrendingUp, DollarSign, Calendar, Target,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Award, Flame
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

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

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function PlanningSection() {
  const { user } = useAuth();
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<MonthlyPlan | null>(null);

  // Dialogs
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MonthlyPlan | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string } | null>(null);

  // Form states
  const [planMonth, setPlanMonth] = useState(new Date().getMonth() + 1);
  const [planYear, setPlanYear] = useState(new Date().getFullYear());
  const [planDescription, setPlanDescription] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalUnit, setGoalUnit] = useState('unidade');

  useEffect(() => {
    if (user) fetchMonthlyPlans();
  }, [user]);

  const fetchMonthlyPlans = async () => {
    setLoading(true);
    try {
      const { data: plans } = await supabase
        .from('monthly_plans')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      const plansWithGoals: MonthlyPlan[] = [];
      for (const plan of plans || []) {
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('monthly_plan_id', plan.id);
        plansWithGoals.push({ ...plan, goals: goals || [] });
      }
      setMonthlyPlans(plansWithGoals);
      
      // Auto-select current month if exists
      const currentPlan = plansWithGoals.find(
        p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()
      );
      if (currentPlan) setSelectedMonth(currentPlan);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
    setLoading(false);
  };

  // Calculate year stats
  const yearPlans = monthlyPlans.filter(p => p.year === selectedYear);
  const allGoals = yearPlans.flatMap(p => p.goals);
  const completedGoals = allGoals.filter(g => g.current_value >= g.target_value);
  const totalGoals = allGoals.length;
  const avgProgress = totalGoals > 0
    ? allGoals.reduce((sum, g) => {
        const p = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
        return sum + Math.min(p, 100);
      }, 0) / totalGoals
    : 0;

  // Monthly progress data for chart
  const monthlyProgressData = MONTHS.map((name, i) => {
    const plan = yearPlans.find(p => p.month === i + 1);
    if (!plan || plan.goals.length === 0) return { name: name.slice(0, 3), progress: 0, goals: 0 };
    
    const progress = plan.goals.reduce((sum, g) => {
      const p = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
      return sum + Math.min(p, 100);
    }, 0) / plan.goals.length;
    
    return { name: name.slice(0, 3), progress: Math.round(progress), goals: plan.goals.length };
  });

  // Handlers
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
        await supabase
          .from('monthly_plans')
          .update({ description: planDescription })
          .eq('id', editingPlan.id);
        toast.success('Planejamento atualizado!');
      } else {
        const { error } = await supabase.from('monthly_plans').insert({
          user_id: user.id,
          month: planMonth,
          year: planYear,
          description: planDescription || null,
        });
        if (error?.code === '23505') {
          toast.error('Já existe um planejamento para este mês');
          return;
        }
        toast.success('Planejamento criado!');
      }
      setShowPlanDialog(false);
      fetchMonthlyPlans();
    } catch (error) {
      toast.error('Erro ao salvar planejamento');
    }
  };

  const handleOpenGoalDialog = (goal?: Goal) => {
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
    if (!selectedMonth || !goalTitle.trim()) return;

    try {
      if (editingGoal) {
        await supabase.from('goals').update({
          title: goalTitle,
          target_value: parseFloat(goalTarget) || 0,
          current_value: parseFloat(goalCurrent) || 0,
          unit: goalUnit,
        }).eq('id', editingGoal.id);
        toast.success('Meta atualizada!');
      } else {
        await supabase.from('goals').insert({
          monthly_plan_id: selectedMonth.id,
          title: goalTitle,
          target_value: parseFloat(goalTarget) || 0,
          current_value: parseFloat(goalCurrent) || 0,
          unit: goalUnit,
        });
        toast.success('Meta criada!');
      }
      setShowGoalDialog(false);
      fetchMonthlyPlans();
    } catch (error) {
      toast.error('Erro ao salvar meta');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const table = deleteItem.type === 'plan' ? 'monthly_plans' : 'goals';
      await supabase.from(table).delete().eq('id', deleteItem.id);
      
      if (deleteItem.type === 'plan' && selectedMonth?.id === deleteItem.id) {
        setSelectedMonth(null);
      }
      
      toast.success('Item excluído!');
      setDeleteItem(null);
      fetchMonthlyPlans();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-500';
    if (progress >= 75) return 'text-blue-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selector & Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Year Summary Card */}
        <Card className="flex-1 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-3xl font-display font-bold">{selectedYear}</h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => handleOpenPlanDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Mês
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Meses</span>
                </div>
                <p className="text-2xl font-bold">{yearPlans.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Metas</span>
                </div>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Concluídas</span>
                </div>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Progresso</span>
                </div>
                <p className="text-2xl font-bold">{avgProgress.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="lg:w-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progresso Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProgressData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Progresso']}
                  />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                    {monthlyProgressData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.progress >= 100 ? '#10B981' : entry.progress > 0 ? '#3B82F6' : '#374151'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {MONTHS.map((month, i) => {
          const plan = yearPlans.find(p => p.month === i + 1);
          const isSelected = selectedMonth?.id === plan?.id;
          const progress = plan && plan.goals.length > 0
            ? plan.goals.reduce((sum, g) => {
                const p = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
                return sum + Math.min(p, 100);
              }, 0) / plan.goals.length
            : 0;

          return (
            <motion.div
              key={month}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all h-full ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : plan
                    ? 'hover:border-primary/50'
                    : 'border-dashed opacity-60 hover:opacity-100'
                }`}
                onClick={() => plan && setSelectedMonth(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{month.slice(0, 3)}</span>
                    {plan && (
                      <Badge variant={progress >= 100 ? 'default' : 'secondary'} className="text-xs">
                        {plan.goals.length} metas
                      </Badge>
                    )}
                  </div>
                  {plan ? (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className={`text-sm font-medium ${getProgressColor(progress)}`}>
                        {progress.toFixed(0)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não criado</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Month Detail */}
      <AnimatePresence mode="wait">
        {selectedMonth && (
          <motion.div
            key={selectedMonth.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      {MONTHS[selectedMonth.month - 1]} {selectedMonth.year}
                    </CardTitle>
                    {selectedMonth.description && (
                      <p className="text-muted-foreground max-w-2xl">{selectedMonth.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenPlanDialog(selectedMonth)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteItem({ type: 'plan', id: selectedMonth.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Goals Summary */}
                {selectedMonth.goals.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const completed = selectedMonth.goals.filter(g => g.current_value >= g.target_value).length;
                      const inProgress = selectedMonth.goals.filter(g => g.current_value > 0 && g.current_value < g.target_value).length;
                      const notStarted = selectedMonth.goals.filter(g => g.current_value === 0).length;
                      
                      return (
                        <>
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div>
                              <p className="text-2xl font-bold text-green-500">{completed}</p>
                              <p className="text-sm text-muted-foreground">Concluídas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-2xl font-bold text-blue-500">{inProgress}</p>
                              <p className="text-sm text-muted-foreground">Em Progresso</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                            <Circle className="h-8 w-8 text-gray-500" />
                            <div>
                              <p className="text-2xl font-bold text-gray-500">{notStarted}</p>
                              <p className="text-sm text-muted-foreground">Não Iniciadas</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Goals List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Metas do Mês
                    </h3>
                    <Button onClick={() => handleOpenGoalDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Meta
                    </Button>
                  </div>

                  {selectedMonth.goals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedMonth.goals.map((goal, index) => {
                        const progress = goal.target_value > 0
                          ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                          : 0;
                        const isCompleted = progress >= 100;

                        return (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className={`${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    {isCompleted ? (
                                      <div className="p-2 rounded-lg bg-green-500/20">
                                        <Award className="h-5 w-5 text-green-500" />
                                      </div>
                                    ) : (
                                      <div className="p-2 rounded-lg bg-primary/10">
                                        <Target className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-semibold">{goal.title}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {goal.current_value} / {goal.target_value} {goal.unit}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenGoalDialog(goal)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem({ type: 'goal', id: goal.id })}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progresso</span>
                                    <span className={`font-semibold ${getProgressColor(progress)}`}>
                                      {progress.toFixed(0)}%
                                    </span>
                                  </div>
                                  <Progress value={progress} className="h-3" />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhuma meta definida para este mês</p>
                        <Button onClick={() => handleOpenGoalDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar primeira meta
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedMonth && yearPlans.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Comece seu Planejamento</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Crie planejamentos mensais para definir metas, acompanhar progresso e alcançar seus objetivos.
            </p>
            <Button size="lg" onClick={() => handleOpenPlanDialog()}>
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Planejamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Planejamento' : 'Novo Planejamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingPlan && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select value={planMonth.toString()} onValueChange={(v) => setPlanMonth(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={planYear}
                    onChange={(e) => setPlanYear(parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição / Foco do Mês</Label>
              <Textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Ex: Foco em prospecção ativa e conversão de leads..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Meta</Label>
              <Input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Ex: Fechar 10 vendas, Prospectar 100 leads..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Alvo</Label>
                <Input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Atual</Label>
                <Input
                  type="number"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={goalUnit}
                onChange={(e) => setGoalUnit(e.target.value)}
                placeholder="unidades, vendas, leads..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveGoal}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir? Esta ação não pode ser desfeita.
              {deleteItem?.type === 'plan' && ' Todas as metas deste mês serão excluídas também.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
