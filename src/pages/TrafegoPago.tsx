import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import DetailPanel from '@/components/ui/detail-panel';
import {
  Plus, TrendingUp, DollarSign, Target, BarChart3,
  Edit, Trash2, Calendar, Settings, Save, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface MetricDefinition {
  id: string;
  name: string;
  unit: string;
  color: string;
}

interface CampaignMetric {
  id: string;
  campaign_id: string;
  metric_date: string;
  metrics: Record<string, number>;
  notes: string | null;
}

const PLATFORMS = [
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'youtube', label: 'YouTube Ads' },
  { value: 'other', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativa', color: 'bg-green-500' },
  { value: 'paused', label: 'Pausada', color: 'bg-yellow-500' },
  { value: 'ended', label: 'Encerrada', color: 'bg-gray-500' },
];

export default function TrafegoPago() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metricDefs, setMetricDefs] = useState<MetricDefinition[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showMetricDefDialog, setShowMetricDefDialog] = useState(false);
  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    platform: 'meta',
    status: 'active',
    budget: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [metricDefForm, setMetricDefForm] = useState({
    name: '',
    unit: '',
  });

  const [metricForm, setMetricForm] = useState({
    metric_date: format(new Date(), 'yyyy-MM-dd'),
    metrics: {} as Record<string, string>,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCampaigns(), fetchMetricDefs()]);
    setLoading(false);
  };

  const fetchCampaigns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
  };

  const fetchMetricDefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('campaign_metric_definitions')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    setMetricDefs(data || []);
  };

  const fetchCampaignMetrics = async (campaignId: string) => {
    const { data } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('metric_date', { ascending: true });
    setCampaignMetrics((data || []).map(m => ({
      ...m,
      metrics: m.metrics as Record<string, number>
    })));
  };

  // Campaign handlers
  const handleOpenCampaignDialog = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignForm({
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        budget: campaign.budget.toString(),
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        notes: campaign.notes || '',
      });
    } else {
      setEditingCampaign(null);
      setCampaignForm({
        name: '',
        platform: 'meta',
        status: 'active',
        budget: '',
        start_date: '',
        end_date: '',
        notes: '',
      });
    }
    setShowCampaignDialog(true);
  };

  const handleSaveCampaign = async () => {
    if (!user || !campaignForm.name.trim()) return;

    const data = {
      name: campaignForm.name,
      platform: campaignForm.platform,
      status: campaignForm.status,
      budget: parseFloat(campaignForm.budget) || 0,
      start_date: campaignForm.start_date || null,
      end_date: campaignForm.end_date || null,
      notes: campaignForm.notes || null,
    };

    try {
      if (editingCampaign) {
        const { error } = await supabase
          .from('ad_campaigns')
          .update(data)
          .eq('id', editingCampaign.id);
        if (error) throw error;
        toast.success('Campanha atualizada!');
      } else {
        const { error } = await supabase
          .from('ad_campaigns')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        toast.success('Campanha criada!');
      }
      setShowCampaignDialog(false);
      fetchCampaigns();
    } catch (error) {
      toast.error('Erro ao salvar campanha');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
      if (error) throw error;
      toast.success('Campanha excluída!');
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
      fetchCampaigns();
    } catch (error) {
      toast.error('Erro ao excluir campanha');
    }
  };

  // Metric definition handlers
  const handleSaveMetricDef = async () => {
    if (!user || !metricDefForm.name.trim()) return;

    try {
      const { error } = await supabase.from('campaign_metric_definitions').insert({
        user_id: user.id,
        name: metricDefForm.name,
        unit: metricDefForm.unit,
      });
      if (error) throw error;
      toast.success('Métrica criada!');
      setShowMetricDefDialog(false);
      setMetricDefForm({ name: '', unit: '' });
      fetchMetricDefs();
    } catch (error) {
      toast.error('Erro ao criar métrica');
    }
  };

  const handleDeleteMetricDef = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaign_metric_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Métrica excluída!');
      fetchMetricDefs();
    } catch (error) {
      toast.error('Erro ao excluir métrica');
    }
  };

  // Add metric entry
  const handleSaveMetric = async () => {
    if (!selectedCampaign) return;

    const metricsData: Record<string, number> = {};
    Object.entries(metricForm.metrics).forEach(([key, value]) => {
      if (value) metricsData[key] = parseFloat(value);
    });

    try {
      const { error } = await supabase.from('campaign_metrics').insert({
        campaign_id: selectedCampaign.id,
        metric_date: metricForm.metric_date,
        metrics: metricsData,
        notes: metricForm.notes || null,
      });
      if (error) throw error;
      toast.success('Métricas registradas!');
      setShowAddMetricDialog(false);
      setMetricForm({
        metric_date: format(new Date(), 'yyyy-MM-dd'),
        metrics: {},
        notes: '',
      });
      fetchCampaignMetrics(selectedCampaign.id);
    } catch (error) {
      toast.error('Erro ao registrar métricas');
    }
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignMetrics(campaign.id);
  };

  // Chart data
  const getChartData = () => {
    return campaignMetrics.map((m) => ({
      date: format(parseISO(m.metric_date), 'dd/MM'),
      ...m.metrics,
    }));
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge className={`${option?.color} text-white`}>
        {option?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display text-foreground tracking-wide">Tráfego Pago</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas campanhas e acompanhe métricas personalizadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowMetricDefDialog(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Métricas
          </Button>
          <Button onClick={() => handleOpenCampaignDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.filter((c) => c.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {campaigns.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">Budget Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricDefs.length}</p>
                <p className="text-sm text-muted-foreground">Métricas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Campanhas</h2>
          {campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma campanha criada</p>
              <Button onClick={() => handleOpenCampaignDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedCampaign?.id === campaign.id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => handleSelectCampaign(campaign)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {PLATFORMS.find((p) => p.value === campaign.platform)?.label}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          R$ {campaign.budget.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCampaignDialog(campaign);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Details */}
        <div className="lg:col-span-2">
          {selectedCampaign ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedCampaign.name}
                    {getStatusBadge(selectedCampaign.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {PLATFORMS.find((p) => p.value === selectedCampaign.platform)?.label}
                  </p>
                </div>
                <Button onClick={() => setShowAddMetricDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Métricas
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart */}
                {campaignMetrics.length > 0 && metricDefs.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        {metricDefs.map((def, i) => (
                          <Line
                            key={def.id}
                            type="monotone"
                            dataKey={def.id}
                            name={def.name}
                            stroke={def.color || `hsl(${i * 60}, 70%, 50%)`}
                            strokeWidth={2}
                            dot={{ fill: def.color || `hsl(${i * 60}, 70%, 50%)` }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-xl">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {metricDefs.length === 0
                          ? 'Crie métricas para começar'
                          : 'Adicione registros de métricas para ver o gráfico'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metrics Table */}
                {campaignMetrics.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Histórico de Métricas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3">Data</th>
                            {metricDefs.map((def) => (
                              <th key={def.id} className="text-right py-2 px-3">
                                {def.name}
                              </th>
                            ))}
                            <th className="text-left py-2 px-3">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignMetrics
                            .slice()
                            .reverse()
                            .map((metric) => (
                              <tr key={metric.id} className="border-b border-border/50">
                                <td className="py-2 px-3">
                                  {format(parseISO(metric.metric_date), 'dd/MM/yyyy')}
                                </td>
                                {metricDefs.map((def) => (
                                  <td key={def.id} className="text-right py-2 px-3 font-medium">
                                    {metric.metrics[def.id]?.toLocaleString('pt-BR') || '-'}
                                    {def.unit && (
                                      <span className="text-muted-foreground ml-1 text-xs">
                                        {def.unit}
                                      </span>
                                    )}
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-muted-foreground max-w-xs truncate">
                                  {metric.notes || '-'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-12">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma campanha</h3>
                <p className="text-muted-foreground">
                  Clique em uma campanha para ver detalhes e registrar métricas
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="Ex: Black Friday 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={campaignForm.platform}
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={campaignForm.status}
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget (R$)</Label>
              <Input
                type="number"
                value={campaignForm.budget}
                onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={campaignForm.notes}
                onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })}
                placeholder="Anotações sobre a campanha..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCampaign}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Definitions Dialog */}
      <Dialog open={showMetricDefDialog} onOpenChange={setShowMetricDefDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Gerenciar Métricas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add new metric */}
            <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Métrica</Label>
                  <Input
                    value={metricDefForm.name}
                    onChange={(e) => setMetricDefForm({ ...metricDefForm, name: e.target.value })}
                    placeholder="Ex: ROAS, CPA, CPM..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input
                    value={metricDefForm.unit}
                    onChange={(e) => setMetricDefForm({ ...metricDefForm, unit: e.target.value })}
                    placeholder="Ex: %, R$..."
                  />
                </div>
              </div>
              <Button onClick={handleSaveMetricDef} disabled={!metricDefForm.name.trim()} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Métrica
              </Button>
            </div>

            {/* List */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Métricas Existentes</Label>
              {metricDefs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma métrica criada ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {metricDefs.map((def) => (
                    <div
                      key={def.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                    >
                      <div>
                        <span className="font-medium">{def.name}</span>
                        {def.unit && (
                          <span className="text-muted-foreground ml-2 text-sm">({def.unit})</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMetricDef(def.id)}
                        className="h-8 w-8 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricDefDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Metric Entry Dialog */}
      <Dialog open={showAddMetricDialog} onOpenChange={setShowAddMetricDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Registrar Métricas do Dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={metricForm.metric_date}
                onChange={(e) => setMetricForm({ ...metricForm, metric_date: e.target.value })}
              />
            </div>

            {metricDefs.length === 0 ? (
              <div className="text-center py-4 bg-secondary/30 rounded-xl">
                <p className="text-muted-foreground mb-2">Nenhuma métrica definida</p>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddMetricDialog(false);
                  setShowMetricDefDialog(true);
                }}>
                  Criar Métricas
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {metricDefs.map((def) => (
                  <div key={def.id} className="space-y-2">
                    <Label>
                      {def.name}
                      {def.unit && <span className="text-muted-foreground ml-1">({def.unit})</span>}
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={metricForm.metrics[def.id] || ''}
                      onChange={(e) =>
                        setMetricForm({
                          ...metricForm,
                          metrics: { ...metricForm.metrics, [def.id]: e.target.value },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={metricForm.notes}
                onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })}
                placeholder="Notas do dia..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMetricDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMetric} disabled={metricDefs.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
