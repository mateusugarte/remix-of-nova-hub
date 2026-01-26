import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Plus, Trash2, Edit, Target, TrendingUp, TrendingDown,
  BarChart3, Users, Calendar, DollarSign, CheckCircle, XCircle
} from 'lucide-react';
import { isBefore, parseISO, startOfMonth, isAfter } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Tooltip,
} from 'recharts';

// Available metric sources (excluding traffic campaigns)
const METRIC_SOURCES = [
  // Leads Inbound
  { id: 'leads_inbound_total', name: 'Leads Inbound - Total', category: 'Leads Inbound', unit: 'leads' },
  { id: 'leads_inbound_scheduling_rate', name: 'Leads Inbound - Taxa de Agendamentos', category: 'Leads Inbound', unit: '%' },
  { id: 'leads_inbound_noshow_rate', name: 'Leads Inbound - Taxa de No-Show', category: 'Leads Inbound', unit: '%' },
  { id: 'leads_inbound_conversion_rate', name: 'Leads Inbound - Taxa de Conversão', category: 'Leads Inbound', unit: '%' },
  { id: 'leads_inbound_hot', name: 'Leads Inbound - Leads Quentes (80+)', category: 'Leads Inbound', unit: 'leads' },
  { id: 'leads_inbound_good', name: 'Leads Inbound - Leads Bons (60-79)', category: 'Leads Inbound', unit: 'leads' },
  
  // Prospecção
  { id: 'prospects_total', name: 'Prospecção - Total', category: 'Prospecção', unit: 'leads' },
  { id: 'prospects_conversion_rate', name: 'Prospecção - Taxa de Conversão', category: 'Prospecção', unit: '%' },
  { id: 'prospects_meetings', name: 'Prospecção - Reuniões Agendadas', category: 'Prospecção', unit: 'reuniões' },
  
  // Clientes
  { id: 'clients_total', name: 'Clientes - Total', category: 'Clientes', unit: 'clientes' },
  { id: 'clients_mrr', name: 'Clientes - MRR', category: 'Clientes', unit: 'R$' },
  { id: 'clients_received_month', name: 'Clientes - Recebido no Mês', category: 'Clientes', unit: 'R$' },
  { id: 'clients_overdue', name: 'Clientes - Pagamentos em Atraso', category: 'Clientes', unit: 'pagamentos' },
];

interface CommercialMetric {
  id: string;
  name: string;
  target_value: number;
  comparison_source: string;
  created_at: string;
}

interface RealTimeData {
  [key: string]: number;
}

export default function MetricasComerciais() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CommercialMetric[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({});
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CommercialMetric | null>(null);
  const [deleteMetricId, setDeleteMetricId] = useState<string | null>(null);
  
  // Form states
  const [metricName, setMetricName] = useState('');
  const [metricTarget, setMetricTarget] = useState('');
  const [metricSource, setMetricSource] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchRealTimeData()]);
    setLoading(false);
  };

  const fetchMetrics = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('commercial_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRealTimeData = async () => {
    if (!user) return;
    
    try {
      // Fetch leads inbound data
      const { data: leadsData } = await supabase
        .from('inbound_leads')
        .select('*')
        .eq('user_id', user.id);
      
      const leads = leadsData || [];
      const leadsTotal = leads.length;
      const leadsScheduled = leads.filter(l => l.meeting_date).length;
      const leadsNoShow = leads.filter(l => l.no_show).length;
      const leadsSold = leads.filter(l => l.status === 'sold').length;
      const leadsHot = leads.filter(l => (l.lead_score || 0) >= 80).length;
      const leadsGood = leads.filter(l => (l.lead_score || 0) >= 60 && (l.lead_score || 0) < 80).length;
      
      // Fetch prospects data
      const { data: prospectsData } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id);
      
      const prospects = prospectsData || [];
      const prospectsTotal = prospects.length;
      const prospectsSold = prospects.filter(p => p.status === 'vendido').length;
      const prospectsMeetings = prospects.filter(p => p.status === 'agendou_reuniao').length;
      
      // Fetch clients data
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*, client_payments(*)')
        .eq('user_id', user.id);
      
      const clients = clientsData || [];
      const clientsTotal = clients.length;
      const clientsMRR = clients.reduce((sum, c) => sum + (c.recurrence_value || 0), 0);
      
      const allPayments = clients.flatMap(c => (c.client_payments as any[]) || []);
      const paidThisMonth = allPayments.filter(p => 
        p.is_paid && 
        p.paid_at && 
        isAfter(parseISO(p.paid_at), startOfMonth(new Date()))
      );
      const receivedThisMonth = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);
      const overduePayments = allPayments.filter(p => !p.is_paid && isBefore(parseISO(p.due_date), new Date())).length;
      
      setRealTimeData({
        leads_inbound_total: leadsTotal,
        leads_inbound_scheduling_rate: leadsTotal > 0 ? Math.round((leadsScheduled / leadsTotal) * 100) : 0,
        leads_inbound_noshow_rate: leadsScheduled > 0 ? Math.round((leadsNoShow / leadsScheduled) * 100) : 0,
        leads_inbound_conversion_rate: leadsTotal > 0 ? Math.round((leadsSold / leadsTotal) * 100) : 0,
        leads_inbound_hot: leadsHot,
        leads_inbound_good: leadsGood,
        
        prospects_total: prospectsTotal,
        prospects_conversion_rate: prospectsTotal > 0 ? Math.round((prospectsSold / prospectsTotal) * 100) : 0,
        prospects_meetings: prospectsMeetings,
        
        clients_total: clientsTotal,
        clients_mrr: clientsMRR,
        clients_received_month: receivedThisMonth,
        clients_overdue: overduePayments,
      });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const handleOpenDialog = (metric?: CommercialMetric) => {
    if (metric) {
      setEditingMetric(metric);
      setMetricName(metric.name);
      setMetricTarget(metric.target_value.toString());
      setMetricSource(metric.comparison_source);
    } else {
      setEditingMetric(null);
      setMetricName('');
      setMetricTarget('');
      setMetricSource('');
    }
    setShowDialog(true);
  };

  const handleSaveMetric = async () => {
    if (!user || !metricName.trim() || !metricSource) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const data = {
        name: metricName,
        target_value: parseFloat(metricTarget) || 0,
        comparison_source: metricSource,
      };

      if (editingMetric) {
        const { error } = await supabase
          .from('commercial_metrics')
          .update(data)
          .eq('id', editingMetric.id);
        if (error) throw error;
        toast.success('Métrica atualizada!');
      } else {
        const { error } = await supabase
          .from('commercial_metrics')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        toast.success('Métrica criada!');
      }

      setShowDialog(false);
      fetchMetrics();
    } catch (error) {
      console.error('Error saving metric:', error);
      toast.error('Erro ao salvar métrica');
    }
  };

  const handleDeleteMetric = async () => {
    if (!deleteMetricId) return;
    try {
      const { error } = await supabase
        .from('commercial_metrics')
        .delete()
        .eq('id', deleteMetricId);
      if (error) throw error;
      toast.success('Métrica excluída!');
      setDeleteMetricId(null);
      fetchMetrics();
    } catch (error) {
      toast.error('Erro ao excluir métrica');
    }
  };

  const getSourceInfo = (sourceId: string) => {
    return METRIC_SOURCES.find(s => s.id === sourceId);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    if (unit === '%') {
      return `${value}%`;
    }
    return value.toString();
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = target > 0 ? (current / target) * 100 : 0;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Group sources by category for select
  const groupedSources = METRIC_SOURCES.reduce((acc, source) => {
    if (!acc[source.category]) acc[source.category] = [];
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, typeof METRIC_SOURCES>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display text-foreground tracking-wide">Métricas Comerciais</h1>
          <p className="text-muted-foreground mt-1">Compare suas metas com os resultados reais do sistema</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Métrica
        </Button>
      </motion.div>

      {/* Metrics Grid */}
      {metrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {metrics.map((metric, index) => {
              const source = getSourceInfo(metric.comparison_source);
              const currentValue = realTimeData[metric.comparison_source] || 0;
              const target = metric.target_value;
              const percentage = target > 0 ? Math.min((currentValue / target) * 100, 150) : 0;
              const isAchieved = currentValue >= target;
              const diff = currentValue - target;

              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${getProgressColor(currentValue, target)}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold">{metric.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{source?.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(metric)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteMetricId(metric.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Chart */}
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Atual', value: currentValue, fill: isAchieved ? '#22c55e' : '#f97316' },
                              { name: 'Meta', value: target, fill: 'hsl(var(--muted))' },
                            ]}
                            layout="vertical"
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                          >
                            <XAxis type="number" hide domain={[0, Math.max(target, currentValue) * 1.1]} />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                                      <p className="text-sm font-medium">
                                        {payload[0].payload.name}: {formatValue(payload[0].value as number, source?.unit || '')}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={24}>
                              {[
                                { name: 'Atual', value: currentValue, fill: isAchieved ? '#22c55e' : '#f97316' },
                                { name: 'Meta', value: target, fill: 'hsl(var(--muted))' },
                              ].map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Current vs Target Values */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isAchieved ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <div>
                            <p className="text-xs text-muted-foreground">Atual</p>
                            <p className="text-lg font-bold">{formatValue(currentValue, source?.unit || '')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-muted" />
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Meta</p>
                            <p className="text-lg font-semibold text-muted-foreground">{formatValue(target, source?.unit || '')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isAchieved ? 'text-green-500' : 'text-orange-500'}`}>
                          {percentage.toFixed(0)}% da meta
                        </span>
                        <div className={`flex items-center gap-1 ${isAchieved ? 'text-green-500' : 'text-orange-500'}`}>
                          {isAchieved ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">+{formatValue(Math.abs(diff), source?.unit || '')}</span>
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4" />
                              <span className="font-medium">Faltam {formatValue(Math.abs(diff), source?.unit || '')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma métrica cadastrada</h3>
          <p className="text-muted-foreground mb-4">Crie métricas comerciais para acompanhar seu desempenho</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Métrica
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{editingMetric ? 'Editar Métrica' : 'Nova Métrica'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Métrica *</Label>
              <Input
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="Ex: Meta de Agendamentos"
              />
            </div>

            <div className="space-y-2">
              <Label>Comparar com *</Label>
              <Select value={metricSource} onValueChange={setMetricSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a métrica do sistema" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-[300px]">
                  {Object.entries(groupedSources).map(([category, sources]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {category}
                      </div>
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{source.name.replace(`${category} - `, '')}</span>
                            <span className="text-xs text-muted-foreground ml-2">({source.unit})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {metricSource && (
                <p className="text-xs text-muted-foreground">
                  Valor atual: {formatValue(realTimeData[metricSource] || 0, getSourceInfo(metricSource)?.unit || '')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Meta (Valor Esperado) *</Label>
              <Input
                type="number"
                value={metricTarget}
                onChange={(e) => setMetricTarget(e.target.value)}
                placeholder="Ex: 50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveMetric}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMetricId} onOpenChange={() => setDeleteMetricId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Métrica</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta métrica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMetric} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}