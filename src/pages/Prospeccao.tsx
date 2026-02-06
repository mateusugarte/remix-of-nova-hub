import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Settings2 } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import KanbanBoard, { KanbanColumn } from '@/components/kanban/KanbanBoard';
import LeadCard from '@/components/kanban/LeadCard';
import LeadFormDialog from '@/components/kanban/LeadFormDialog';
import ColumnManagerDialog, { ProspectColumn } from '@/components/prospeccao/ColumnManagerDialog';

interface Prospect {
  id: string;
  phone_number: string | null;
  instagram_link: string | null;
  profile_summary: string | null;
  contact_summary: string | null;
  approach_description: string | null;
  prospecting_method: string[] | null;
  status: string;
  needs_follow_up: boolean;
  has_meeting_scheduled: boolean;
  meeting_date: string | null;
  was_rejected: boolean;
  rejection_reason: string | null;
  objections: string | null;
  created_at: string;
  faturamento: string | null;
  principal_dor: string | null;
  nicho: string | null;
  nome_dono: string | null;
  socios: string[] | null;
}

const DEFAULT_COLUMNS = [
  { title: 'Entrar em Contato', color: '#6B7280', order_index: 0 },
  { title: 'Mensagem Enviada', color: '#8B5CF6', order_index: 1 },
  { title: 'Respondeu', color: '#F59E0B', order_index: 2 },
  { title: 'Rejeitou', color: '#EF4444', order_index: 3 },
  { title: 'Agendou', color: '#10B981', order_index: 4 },
];

export default function Prospeccao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<ProspectColumn[]>([]);

  useEffect(() => {
    if (user) {
      fetchColumns();
      fetchProspects();
    }
  }, [user]);

  const fetchColumns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('prospect_columns')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index');

    if (data && data.length > 0) {
      setDynamicColumns(data);
    } else {
      // Seed default columns
      const toInsert = DEFAULT_COLUMNS.map((c) => ({ ...c, user_id: user.id }));
      const { data: inserted } = await supabase
        .from('prospect_columns')
        .insert(toInsert)
        .select();
      if (inserted) setDynamicColumns(inserted);
    }
  };

  const fetchProspects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const mappedData = (data || []).map((p) => {
      let newStatus = p.status;
      if (p.status === 'nao_atendeu' || p.status === 'follow_up') newStatus = 'entrar_contato';
      if (p.status === 'ligar_depois') newStatus = 'mensagem_enviada';
      if (p.status === 'scheduled') newStatus = 'agendou';
      if (p.status === 'agendou_reuniao') newStatus = 'agendou';
      if (p.status === 'converted' || p.status === 'vendido') newStatus = 'agendou';
      return { ...p, status: newStatus, socios: p.socios as string[] | null };
    });

    setProspects(mappedData);
  };

  // Convert dynamic columns to KanbanColumn format (use id as column id)
  const kanbanColumns: KanbanColumn[] = dynamicColumns
    .sort((a, b) => a.order_index - b.order_index)
    .map((c) => ({ id: c.id, title: c.title, color: c.color }));

  // Column CRUD
  const handleAddColumn = async (title: string, color: string) => {
    if (!user) return;
    const maxOrder = dynamicColumns.reduce((max, c) => Math.max(max, c.order_index), -1);
    const { error } = await supabase
      .from('prospect_columns')
      .insert({ user_id: user.id, title, color, order_index: maxOrder + 1 });
    if (error) {
      toast({ title: 'Erro ao criar coluna', variant: 'destructive' });
    } else {
      fetchColumns();
    }
  };

  const handleUpdateColumn = async (id: string, title: string, color: string) => {
    const { error } = await supabase
      .from('prospect_columns')
      .update({ title, color })
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar coluna', variant: 'destructive' });
    } else {
      fetchColumns();
    }
  };

  const handleDeleteColumn = async (id: string) => {
    const prospectsInColumn = prospects.filter((p) => p.status === id);
    if (prospectsInColumn.length > 0) {
      toast({ title: 'Mova os leads desta coluna antes de excluí-la', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('prospect_columns')
      .delete()
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir coluna', variant: 'destructive' });
    } else {
      fetchColumns();
    }
  };

  const handleMoveCard = async (cardId: string, newStatus: string) => {
    const { error } = await supabase
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', cardId);
    if (error) {
      toast({ title: 'Erro ao mover card', variant: 'destructive' });
    } else {
      fetchProspects();
    }
  };

  const handleCardClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!user) return;
    setLoading(true);

    const dataToSave = {
      phone_number: formData.phone_number || null,
      instagram_link: formData.instagram_link || null,
      faturamento: formData.faturamento || null,
      principal_dor: formData.principal_dor || null,
      nicho: formData.nicho || null,
      nome_dono: formData.nome_dono || null,
      socios: formData.socios.length > 0 ? formData.socios : null,
      meeting_date: formData.meeting_date || null,
      profile_summary: formData.notes || null,
    };

    if (selectedProspect) {
      const { error } = await supabase
        .from('prospects')
        .update(dataToSave)
        .eq('id', selectedProspect.id);
      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'Lead atualizado!' });
        setIsFormOpen(false);
        setSelectedProspect(null);
        fetchProspects();
      }
    } else {
      // Use the first column's ID as default status
      const firstColumn = dynamicColumns.sort((a, b) => a.order_index - b.order_index)[0];
      const { error } = await supabase.from('prospects').insert({
        ...dataToSave,
        user_id: user.id,
        status: firstColumn?.id || 'entrar_contato',
      });
      if (error) {
        toast({ title: 'Erro ao criar lead', variant: 'destructive' });
      } else {
        toast({ title: 'Lead criado!' });
        setIsFormOpen(false);
        fetchProspects();
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', selectedProspect.id);
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Lead excluído!' });
      setIsFormOpen(false);
      setSelectedProspect(null);
      fetchProspects();
    }
    setLoading(false);
  };

  const filteredProspects = prospects.filter((prospect) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      prospect.phone_number?.includes(search) ||
      prospect.instagram_link?.toLowerCase().includes(search) ||
      prospect.nome_dono?.toLowerCase().includes(search) ||
      prospect.nicho?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads de prospecção ativa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsColumnManagerOpen(true)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Colunas
          </Button>
          <Button
            onClick={() => {
              setSelectedProspect(null);
              setIsFormOpen(true);
            }}
            className="btn-scale"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total" value={filteredProspects.length} icon={<Users className="w-5 h-5" />} />
        {kanbanColumns.slice(0, 5).map((col) => (
          <MetricCard
            key={col.id}
            title={col.title}
            value={filteredProspects.filter((p) => p.status === col.id).length}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por telefone, Instagram, dono ou nicho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        columns={kanbanColumns}
        items={filteredProspects}
        onMoveCard={handleMoveCard}
        onCardClick={handleCardClick}
        renderCard={(prospect) => (
          <LeadCard
            phone_number={prospect.phone_number}
            instagram_link={prospect.instagram_link}
            nome_dono={prospect.nome_dono}
            nicho={prospect.nicho}
            faturamento={prospect.faturamento}
            meeting_date={prospect.meeting_date}
            created_at={prospect.created_at}
          />
        )}
      />

      {/* Form Dialog */}
      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedProspect ? 'Editar Lead' : 'Novo Lead'}
        isEditing={!!selectedProspect}
        initialData={
          selectedProspect
            ? {
                phone_number: selectedProspect.phone_number || '',
                instagram_link: selectedProspect.instagram_link || '',
                email: '',
                nome_lead: '',
                faturamento: selectedProspect.faturamento || '',
                principal_dor: selectedProspect.principal_dor || '',
                nicho: selectedProspect.nicho || '',
                nome_dono: selectedProspect.nome_dono || '',
                socios: selectedProspect.socios || [],
                meeting_date: selectedProspect.meeting_date
                  ? selectedProspect.meeting_date.slice(0, 16)
                  : '',
                notes: selectedProspect.profile_summary || '',
              }
            : undefined
        }
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Column Manager */}
      <ColumnManagerDialog
        open={isColumnManagerOpen}
        onOpenChange={setIsColumnManagerOpen}
        columns={dynamicColumns}
        onAdd={handleAddColumn}
        onUpdate={handleUpdateColumn}
        onDelete={handleDeleteColumn}
        onReorder={() => {}}
      />
    </div>
  );
}
