import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Settings2, Tag } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import KanbanBoard, { KanbanColumn } from '@/components/kanban/KanbanBoard';
import LeadCardWithChannel from '@/components/leads/LeadCardWithChannel';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import ChannelManager, { LeadChannel } from '@/components/leads/ChannelManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InboundLead {
  id: string;
  phone_number: string | null;
  instagram_link: string | null;
  email: string | null;
  nome_lead: string | null;
  faturamento: string | null;
  principal_dor: string | null;
  nicho: string | null;
  nome_dono: string | null;
  socios: string[] | null;
  meeting_date: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  created_at: string;
  lead_score: number | null;
  template_id: string | null;
  custom_fields: Record<string, any> | null;
  channel_id: string | null;
}

// New pipeline columns
const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'form_filled', title: 'Preencheu Formulário', color: '#8B5CF6' },
  { id: 'waiting_response', title: 'Aguardando Resposta', color: '#6B7280' },
  { id: 'qualifying_bant', title: 'Qualificando (BANT)', color: '#F59E0B' },
  { id: 'meeting_scheduled', title: 'Reunião Agendada', color: '#3B82F6' },
  { id: 'follow_up', title: 'Follow Up', color: '#06B6D4' },
  { id: 'sold', title: 'Vendido', color: '#10B981' },
  { id: 'disqualified', title: 'Desqualificado', color: '#EF4444' },
];

export default function LeadsInbound() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [channels, setChannels] = useState<LeadChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<InboundLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewLead, setIsNewLead] = useState(false);
  const [isChannelManagerOpen, setIsChannelManagerOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    hot: 0,
    good: 0,
    nurturing: 0,
    outOfProfile: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
      fetchChannels();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('inbound_leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const mappedData = (data || []).map((lead) => ({
      ...lead,
      socios: lead.socios as string[] | null,
      custom_fields: lead.custom_fields as Record<string, any> | null,
    }));

    setLeads(mappedData);

    // Calculate stats based on lead scoring
    const total = mappedData.length;
    const hot = mappedData.filter((l) => (l.lead_score || 0) >= 80).length;
    const good = mappedData.filter((l) => (l.lead_score || 0) >= 60 && (l.lead_score || 0) < 80).length;
    const nurturing = mappedData.filter((l) => (l.lead_score || 0) >= 40 && (l.lead_score || 0) < 60).length;
    const outOfProfile = mappedData.filter((l) => (l.lead_score || 0) < 40).length;
    const sold = mappedData.filter((l) => l.status === 'sold').length;
    const conversionRate = total > 0 ? Math.round((sold / total) * 100) : 0;

    setStats({ total, hot, good, nurturing, outOfProfile, conversionRate });
  };

  const fetchChannels = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('lead_channels')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    setChannels(data || []);
  };

  const handleMoveCard = async (cardId: string, newStatus: string) => {
    const { error } = await supabase
      .from('inbound_leads')
      .update({ status: newStatus })
      .eq('id', cardId);

    if (error) {
      toast({ title: 'Erro ao mover card', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleCardClick = (lead: InboundLead) => {
    setSelectedLead(lead);
    setIsNewLead(false);
    setIsDetailOpen(true);
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setIsNewLead(true);
    setIsDetailOpen(true);
  };

  const getChannelById = (channelId: string | null) => {
    if (!channelId) return null;
    return channels.find(c => c.id === channelId) || null;
  };

  const filteredLeads = leads.filter((lead) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        lead.phone_number?.includes(search) ||
        lead.instagram_link?.toLowerCase().includes(search) ||
        lead.nome_dono?.toLowerCase().includes(search) ||
        lead.nicho?.toLowerCase().includes(search) ||
        lead.nome_lead?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }

    // Score filter
    if (scoreFilter !== 'all') {
      const score = lead.lead_score || 0;
      if (scoreFilter === 'hot' && score < 80) return false;
      if (scoreFilter === 'good' && (score < 60 || score >= 80)) return false;
      if (scoreFilter === 'nurturing' && (score < 40 || score >= 60)) return false;
      if (scoreFilter === 'out' && score >= 40) return false;
    }

    // Channel filter
    if (channelFilter !== 'all') {
      if (channelFilter === 'none' && lead.channel_id) return false;
      if (channelFilter !== 'none' && lead.channel_id !== channelFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Leads Inbound</h1>
          <p className="text-muted-foreground mt-1">
            Pipeline de vendas com scoring e canais de origem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsChannelManagerOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Canais
          </Button>
          <Button onClick={handleNewLead} className="btn-scale">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Metrics by Score */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total" value={stats.total} icon={<Users className="w-5 h-5" />} />
        <MetricCard 
          title="🟢 Quente" 
          value={stats.hot} 
          subtitle="80-100 pts"
        />
        <MetricCard 
          title="🟡 Bom" 
          value={stats.good} 
          subtitle="60-79 pts"
        />
        <MetricCard 
          title="🟠 Nutrição" 
          value={stats.nurturing} 
          subtitle="40-59 pts"
        />
        <MetricCard 
          title="🔴 Fora" 
          value={stats.outOfProfile} 
          subtitle="0-39 pts"
        />
        <MetricCard 
          title="Conversão" 
          value={`${stats.conversionRate}%`} 
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por telefone, email, nome ou nicho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por score" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="all">Todos os Leads</SelectItem>
            <SelectItem value="hot">🟢 Lead Quente (80+)</SelectItem>
            <SelectItem value="good">🟡 Lead Bom (60-79)</SelectItem>
            <SelectItem value="nurturing">🟠 Em Nutrição (40-59)</SelectItem>
            <SelectItem value="out">🔴 Fora do Perfil (0-39)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por canal" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="all">Todos os Canais</SelectItem>
            <SelectItem value="none">Sem canal</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: channel.color }}
                  />
                  {channel.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Channels Info */}
      {channels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {channels.map((channel) => {
            const count = leads.filter(l => l.channel_id === channel.id).length;
            return (
              <div
                key={channel.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ 
                  backgroundColor: `${channel.color}15`,
                  border: `1px solid ${channel.color}40`
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: channel.color }}
                />
                <span>{channel.name}</span>
                <span className="font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        columns={KANBAN_COLUMNS}
        items={filteredLeads}
        onMoveCard={handleMoveCard}
        onCardClick={handleCardClick}
        renderCard={(lead) => (
          <LeadCardWithChannel
            phone_number={lead.phone_number}
            instagram_link={lead.instagram_link}
            email={lead.email}
            nome_dono={lead.nome_dono}
            nome_lead={lead.nome_lead}
            nicho={lead.nicho}
            faturamento={lead.faturamento}
            principal_dor={lead.principal_dor}
            meeting_date={lead.meeting_date}
            created_at={lead.created_at}
            lead_score={lead.lead_score || 0}
            notes={lead.notes}
            channel={getChannelById(lead.channel_id)}
          />
        )}
      />

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLead(null);
          setIsNewLead(false);
        }}
        onUpdate={fetchData}
        channels={channels}
        isNew={isNewLead}
      />

      {/* Channel Manager */}
      <ChannelManager
        open={isChannelManagerOpen}
        onOpenChange={setIsChannelManagerOpen}
        onChannelsUpdate={fetchChannels}
      />
    </div>
  );
}
