import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  Plus, TrendingUp, DollarSign, Target, BarChart3,
  Edit, Trash2, Calendar, Settings, Save, Activity,
  ChevronLeft, FolderOpen, Megaphone, ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CampaignGroup {
  id: string;
  name: string;
  description: string | null;
  planning: string | null;
  status: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  group_id: string | null;
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

const METRIC_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function TrafegoPago() {
  const { user } = useAuth();
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metricDefs, setMetricDefs] = useState<MetricDefinition[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CampaignGroup | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showMetricDefDialog, setShowMetricDefDialog] = useState(false);
  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CampaignGroup | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    planning: '',
    status: 'active',
  });

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
    await Promise.all([fetchCampaignGroups(), fetchCampaigns(), fetchMetricDefs()]);
    setLoading(false);
  };

  const fetchCampaignGroups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('campaign_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCampaignGroups(data || []);
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

  // Campaign Group handlers
  const handleOpenGroupDialog = (group?: CampaignGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        description: group.description || '',
        planning: group.planning || '',
        status: group.status,
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', planning: '', status: 'active' });
    }
    setShowGroupDialog(true);
  };

  const handleSaveGroup = async () => {
    if (!user || !groupForm.name.trim()) return;

    const data = {
      name: groupForm.name,
      description: groupForm.description || null,
      planning: groupForm.planning || null,
      status: groupForm.status,
    };

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('campaign_groups')
          .update(data)
          .eq('id', editingGroup.id);
        if (error) throw error;
        toast.success('Campanha geral atualizada!');
        if (selectedGroup?.id === editingGroup.id) {
          setSelectedGroup({ ...selectedGroup, ...data });
        }
      } else {
        const { error } = await supabase
          .from('campaign_groups')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        toast.success('Campanha geral criada!');
      }
      setShowGroupDialog(false);
      fetchCampaignGroups();
    } catch (error) {
      toast.error('Erro ao salvar campanha geral');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('campaign_groups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Campanha geral excluída!');
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setSelectedCampaign(null);
      }
      fetchCampaignGroups();
      fetchCampaigns();
    } catch (error) {
      toast.error('Erro ao excluir campanha geral');
    }
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
    if (!user || !campaignForm.name.trim() || !selectedGroup) return;

    const data = {
      name: campaignForm.name,
      platform: campaignForm.platform,
      status: campaignForm.status,
      budget: parseFloat(campaignForm.budget) || 0,
      start_date: campaignForm.start_date || null,
      end_date: campaignForm.end_date || null,
      notes: campaignForm.notes || null,
      group_id: selectedGroup.id,
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
        color: METRIC_COLORS[metricDefs.length % METRIC_COLORS.length],
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

  const getGroupCampaigns = () => {
    if (!selectedGroup) return [];
    return campaigns.filter(c => c.group_id === selectedGroup.id);
  };

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

  const getTotalBudget = () => {
    if (!selectedGroup) return 0;
    return getGroupCampaigns().reduce((sum, c) => sum + (c.budget || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Main view - Campaign Groups list
  if (!selectedGroup) {
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
              Organize suas campanhas de anúncios por objetivo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowMetricDefDialog(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Métricas
            </Button>
            <Button onClick={() => handleOpenGroupDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha Geral
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaignGroups.length}</p>
                  <p className="text-sm text-muted-foreground">Campanhas Gerais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Megaphone className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Anúncios</p>
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

        {/* Campaign Groups Grid */}
        {campaignGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma campanha geral criada</h3>
            <p className="text-muted-foreground mb-6">
              Crie uma campanha geral para agrupar seus anúncios por objetivo
            </p>
            <Button onClick={() => handleOpenGroupDialog()} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Criar Campanha Geral
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignGroups.map((group) => {
              const groupCampaigns = campaigns.filter(c => c.group_id === group.id);
              const totalBudget = groupCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
              const activeCampaigns = groupCampaigns.filter(c => c.status === 'active').length;
              
              return (
                <motion.div
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer transition-all hover:border-primary/50 h-full"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Target className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            {getStatusBadge(group.status)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGroupDialog(group);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {groupCampaigns.length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activeCampaigns} ativas
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            R$ {totalBudget.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">budget total</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end mt-4 text-sm text-primary">
                        Ver detalhes <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Metric Definition Dialog */}
        <Dialog open={showMetricDefDialog} onOpenChange={setShowMetricDefDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerenciar Métricas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Métrica</Label>
                <Input
                  placeholder="Ex: ROAS, CPA, CTR..."
                  value={metricDefForm.name}
                  onChange={(e) => setMetricDefForm({ ...metricDefForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade (opcional)</Label>
                <Input
                  placeholder="Ex: R$, %, unidades..."
                  value={metricDefForm.unit}
                  onChange={(e) => setMetricDefForm({ ...metricDefForm, unit: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveMetricDef} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Métrica
              </Button>

              {metricDefs.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm">Métricas Existentes</h4>
                  {metricDefs.map((def) => (
                    <div
                      key={def.id}
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: def.color }}
                        />
                        <span className="text-sm">{def.name}</span>
                        {def.unit && (
                          <span className="text-xs text-muted-foreground">({def.unit})</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMetricDef(def.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Campaign Group Dialog */}
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editar Campanha Geral' : 'Nova Campanha Geral'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Lançamento Produto X"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={groupForm.status}
                    onValueChange={(v) => setGroupForm({ ...groupForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label>O que está divulgando</Label>
                <Textarea
                  placeholder="Descreva o produto, serviço ou oferta que está promovendo..."
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Planejamento</Label>
                <Textarea
                  placeholder="Estratégia, objetivos, público-alvo, orçamento planejado..."
                  value={groupForm.planning}
                  onChange={(e) => setGroupForm({ ...groupForm, planning: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGroup}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Detail view - Inside a Campaign Group
  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => {
            setSelectedGroup(null);
            setSelectedCampaign(null);
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar para Campanhas Gerais
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display text-foreground tracking-wide">
                {selectedGroup.name}
              </h1>
              {getStatusBadge(selectedGroup.status)}
            </div>
            {selectedGroup.description && (
              <p className="text-muted-foreground max-w-2xl">
                {selectedGroup.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenGroupDialog(selectedGroup)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button onClick={() => handleOpenCampaignDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Planning Section */}
      {selectedGroup.planning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Planejamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {selectedGroup.planning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getGroupCampaigns().length}</p>
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
                  {getGroupCampaigns().filter((c) => c.status === 'active').length}
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
                  R$ {getTotalBudget().toLocaleString('pt-BR')}
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
          {getGroupCampaigns().length === 0 ? (
            <Card className="p-8 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma campanha criada</p>
              <Button onClick={() => handleOpenCampaignDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {getGroupCampaigns().map((campaign) => (
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
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        {metricDefs.map((def) => (
                          <Line
                            key={def.id}
                            type="monotone"
                            dataKey={def.name}
                            stroke={def.color}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {metricDefs.length === 0
                          ? 'Crie métricas para acompanhar'
                          : 'Registre métricas para ver o gráfico'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metrics Table */}
                {campaignMetrics.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Histórico de Métricas</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left p-3">Data</th>
                            {metricDefs.map((def) => (
                              <th key={def.id} className="text-right p-3">
                                {def.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...campaignMetrics].reverse().map((m) => (
                            <tr key={m.id} className="border-t">
                              <td className="p-3">
                                {format(parseISO(m.metric_date), 'dd/MM/yyyy')}
                              </td>
                              {metricDefs.map((def) => (
                                <td key={def.id} className="text-right p-3">
                                  {m.metrics[def.name] !== undefined
                                    ? `${m.metrics[def.name]} ${def.unit}`
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Campaign Notes */}
                {selectedCampaign.notes && (
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-medium mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Selecione uma campanha</h3>
                <p className="text-muted-foreground">
                  Clique em uma campanha para ver detalhes e métricas
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Anúncio Feed - Oferta 50%"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
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
                  <SelectContent>
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
                  <SelectContent>
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
                placeholder="0"
                value={campaignForm.budget}
                onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
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
                placeholder="Notas sobre a campanha..."
                value={campaignForm.notes}
                onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })}
                rows={3}
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

      {/* Add Metric Dialog */}
      <Dialog open={showAddMetricDialog} onOpenChange={setShowAddMetricDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Métricas</DialogTitle>
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
              <div className="p-4 bg-secondary/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Nenhuma métrica definida
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddMetricDialog(false);
                    setShowMetricDefDialog(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Criar Métricas
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {metricDefs.map((def) => (
                  <div key={def.id} className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: def.color }}
                      />
                      {def.name} {def.unit && `(${def.unit})`}
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={metricForm.metrics[def.name] || ''}
                      onChange={(e) =>
                        setMetricForm({
                          ...metricForm,
                          metrics: { ...metricForm.metrics, [def.name]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Notas sobre as métricas do dia..."
                value={metricForm.notes}
                onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })}
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
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Campanha Geral' : 'Nova Campanha Geral'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Lançamento Produto X"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={groupForm.status}
                  onValueChange={(v) => setGroupForm({ ...groupForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label>O que está divulgando</Label>
              <Textarea
                placeholder="Descreva o produto, serviço ou oferta que está promovendo..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Planejamento</Label>
              <Textarea
                placeholder="Estratégia, objetivos, público-alvo, orçamento planejado..."
                value={groupForm.planning}
                onChange={(e) => setGroupForm({ ...groupForm, planning: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGroup}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Definition Dialog */}
      <Dialog open={showMetricDefDialog} onOpenChange={setShowMetricDefDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Métricas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Métrica</Label>
              <Input
                placeholder="Ex: ROAS, CPA, CTR..."
                value={metricDefForm.name}
                onChange={(e) => setMetricDefForm({ ...metricDefForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade (opcional)</Label>
              <Input
                placeholder="Ex: R$, %, unidades..."
                value={metricDefForm.unit}
                onChange={(e) => setMetricDefForm({ ...metricDefForm, unit: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveMetricDef} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Métrica
            </Button>

            {metricDefs.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium text-sm">Métricas Existentes</h4>
                {metricDefs.map((def) => (
                  <div
                    key={def.id}
                    className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: def.color }}
                      />
                      <span className="text-sm">{def.name}</span>
                      {def.unit && (
                        <span className="text-xs text-muted-foreground">({def.unit})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMetricDef(def.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
