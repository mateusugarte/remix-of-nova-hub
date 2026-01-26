import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Settings2, FileText } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import KanbanBoard, { KanbanColumn } from '@/components/kanban/KanbanBoard';
import LeadCardLarge from '@/components/kanban/LeadCardLarge';
import LeadFormDialogEnhanced from '@/components/kanban/LeadFormDialogEnhanced';
import LeadTemplateDialog from '@/components/kanban/LeadTemplateDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  scoreWeight?: number;
}

interface LeadTemplate {
  id: string;
  name: string;
  description: string | null;
  fields: TemplateField[];
}

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
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'form_filled', title: 'Preencheu Formulário', color: '#8B5CF6' },
  { id: 'contacted', title: 'Respondeu Contato', color: '#6B7280' },
  { id: 'qualified', title: 'Lead Qualificado', color: '#10B981' },
  { id: 'disqualified', title: 'Lead Desqualificado', color: '#EF4444' },
  { id: 'meeting_scheduled', title: 'Agendou Reunião', color: '#3B82F6' },
  { id: 'sale_made', title: 'Venda Feita', color: '#F59E0B' },
];

export default function LeadsInbound() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [templates, setTemplates] = useState<LeadTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<InboundLead | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LeadTemplate | null>(null);
  const [loading, setLoading] = useState(false);
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
      fetchTemplates();
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
    const saleMade = mappedData.filter((l) => l.status === 'sale_made').length;
    const conversionRate = total > 0 ? Math.round((saleMade / total) * 100) : 0;

    setStats({ total, hot, good, nurturing, outOfProfile, conversionRate });
  };

  const fetchTemplates = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('lead_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const mappedTemplates = (data || []).map((t) => ({
      ...t,
      fields: Array.isArray(t.fields) ? (t.fields as unknown as TemplateField[]) : [],
    }));

    setTemplates(mappedTemplates);
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
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!user) return;
    setLoading(true);

    const dataToSave = {
      phone_number: formData.phone_number || null,
      instagram_link: formData.instagram_link || null,
      email: formData.email || null,
      nome_lead: formData.nome_lead || null,
      faturamento: formData.faturamento || null,
      principal_dor: formData.principal_dor || null,
      nicho: formData.nicho || null,
      nome_dono: formData.nome_dono || null,
      socios: formData.socios.length > 0 ? formData.socios : null,
      meeting_date: formData.meeting_date || null,
      notes: formData.notes || null,
      lead_score: formData.lead_score || 0,
      template_id: formData.template_id || null,
      custom_fields: Object.keys(formData.custom_fields).length > 0 ? formData.custom_fields : null,
    };

    if (selectedLead) {
      const { error } = await supabase
        .from('inbound_leads')
        .update(dataToSave)
        .eq('id', selectedLead.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'Lead atualizado!' });
        setIsFormOpen(false);
        setSelectedLead(null);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('inbound_leads').insert({
        ...dataToSave,
        user_id: user.id,
        status: 'form_filled',
      });

      if (error) {
        toast({ title: 'Erro ao criar lead', variant: 'destructive' });
      } else {
        toast({ title: 'Lead criado!' });
        setIsFormOpen(false);
        fetchData();
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    setLoading(true);

    const { error } = await supabase
      .from('inbound_leads')
      .delete()
      .eq('id', selectedLead.id);

    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Lead excluído!' });
      setIsFormOpen(false);
      setSelectedLead(null);
      fetchData();
    }

    setLoading(false);
  };

  const handleManageTemplates = () => {
    setSelectedTemplate(null);
    setIsTemplateDialogOpen(true);
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

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Leads Inbound</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie leads com scoring e templates personalizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManageTemplates}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={() => {
              setSelectedLead(null);
              setIsFormOpen(true);
            }}
            className="btn-scale"
          >
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
      </div>

      {/* Templates Info */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
          <FileText className="w-4 h-4" />
          <span>{templates.length} template{templates.length !== 1 ? 's' : ''} disponível</span>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        columns={KANBAN_COLUMNS}
        items={filteredLeads}
        onMoveCard={handleMoveCard}
        onCardClick={handleCardClick}
        renderCard={(lead) => (
          <LeadCardLarge
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
          />
        )}
      />

      {/* Enhanced Form Dialog */}
      <LeadFormDialogEnhanced
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedLead ? 'Editar Lead' : 'Novo Lead'}
        isEditing={!!selectedLead}
        initialData={
          selectedLead
            ? {
                phone_number: selectedLead.phone_number || '',
                instagram_link: selectedLead.instagram_link || '',
                email: selectedLead.email || '',
                nome_lead: selectedLead.nome_lead || '',
                faturamento: selectedLead.faturamento || '',
                principal_dor: selectedLead.principal_dor || '',
                nicho: selectedLead.nicho || '',
                nome_dono: selectedLead.nome_dono || '',
                socios: selectedLead.socios || [],
                meeting_date: selectedLead.meeting_date
                  ? selectedLead.meeting_date.slice(0, 16)
                  : '',
                notes: selectedLead.notes || '',
                lead_score: selectedLead.lead_score || 50,
                template_id: selectedLead.template_id || null,
                custom_fields: selectedLead.custom_fields || {},
              }
            : undefined
        }
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        loading={loading}
        templates={templates}
        onManageTemplates={handleManageTemplates}
      />

      {/* Template Dialog */}
      <LeadTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        template={selectedTemplate}
        onSave={fetchTemplates}
      />
    </div>
  );
}
