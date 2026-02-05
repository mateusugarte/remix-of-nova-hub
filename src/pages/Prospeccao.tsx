import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import KanbanBoard, { KanbanColumn } from '@/components/kanban/KanbanBoard';
import LeadCard from '@/components/kanban/LeadCard';
import LeadFormDialog from '@/components/kanban/LeadFormDialog';

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

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'entrar_contato', title: 'Entrar em Contato', color: '#6B7280' },
  { id: 'mensagem_enviada', title: 'Mensagem Enviada', color: '#8B5CF6' },
  { id: 'respondeu', title: 'Respondeu', color: '#F59E0B' },
  { id: 'rejeitou', title: 'Rejeitou', color: '#EF4444' },
  { id: 'agendou', title: 'Agendou', color: '#10B981' },
];

export default function Prospeccao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    entrarContato: 0,
    mensagemEnviada: 0,
    respondeu: 0,
    rejeitou: 0,
    agendou: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Map old statuses to new ones
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

    // Calculate stats
    const total = mappedData.length;
    const entrarContato = mappedData.filter((p) => p.status === 'entrar_contato').length;
    const mensagemEnviada = mappedData.filter((p) => p.status === 'mensagem_enviada').length;
    const respondeu = mappedData.filter((p) => p.status === 'respondeu').length;
    const rejeitou = mappedData.filter((p) => p.status === 'rejeitou').length;
    const agendou = mappedData.filter((p) => p.status === 'agendou').length;

    setStats({ total, entrarContato, mensagemEnviada, respondeu, rejeitou, agendou });
  };

  const handleMoveCard = async (cardId: string, newStatus: string) => {
    const { error } = await supabase
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', cardId);

    if (error) {
      toast({ title: 'Erro ao mover card', variant: 'destructive' });
    } else {
      fetchData();
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
        fetchData();
      }
    } else {
      const { error } = await supabase.from('prospects').insert({
        ...dataToSave,
        user_id: user.id,
        status: 'entrar_contato',
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
      fetchData();
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

  const conversionRate = stats.total > 0 ? Math.round((stats.agendou / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads de prospecção ativa
          </p>
        </div>
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

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total" value={stats.total} icon={<Users className="w-5 h-5" />} />
        <MetricCard title="A Contatar" value={stats.entrarContato} />
        <MetricCard title="Msg Enviada" value={stats.mensagemEnviada} />
        <MetricCard title="Respondeu" value={stats.respondeu} />
        <MetricCard title="Rejeitou" value={stats.rejeitou} />
        <MetricCard title="Agendou" value={stats.agendou} />
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
        columns={KANBAN_COLUMNS}
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
    </div>
  );
}
