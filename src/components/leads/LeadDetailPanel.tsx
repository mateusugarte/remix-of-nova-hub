import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DetailPanel from '@/components/ui/detail-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
  Phone, Instagram, Mail, Building2, DollarSign, Calendar,
  User, FileText, Plus, Trash2, Save, Tag, UserX
} from 'lucide-react';
import LeadScoreBadge, { getScoreCategory } from '@/components/kanban/LeadScoreBadge';
import { LeadChannel } from './ChannelManager';

interface LeadData {
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
  channel_id: string | null;
  no_show: boolean | null;
}

interface LeadDetailPanelProps {
  lead: LeadData | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  channels: LeadChannel[];
  isNew?: boolean;
}

export default function LeadDetailPanel({
  lead,
  open,
  onClose,
  onUpdate,
  channels,
  isNew = false,
}: LeadDetailPanelProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    phone_number: '',
    instagram_link: '',
    email: '',
    nome_lead: '',
    faturamento: '',
    principal_dor: '',
    nicho: '',
    nome_dono: '',
    socios: [] as string[],
    meeting_date: '',
    notes: '',
    lead_score: 50,
    channel_id: '',
    no_show: false,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (lead && !isNew) {
      setFormData({
        phone_number: lead.phone_number || '',
        instagram_link: lead.instagram_link || '',
        email: lead.email || '',
        nome_lead: lead.nome_lead || '',
        faturamento: lead.faturamento || '',
        principal_dor: lead.principal_dor || '',
        nicho: lead.nicho || '',
        nome_dono: lead.nome_dono || '',
        socios: lead.socios || [],
        meeting_date: lead.meeting_date ? lead.meeting_date.slice(0, 16) : '',
        notes: lead.notes || '',
        lead_score: lead.lead_score || 50,
        channel_id: lead.channel_id || '',
        no_show: lead.no_show || false,
      });
    } else {
      setFormData({
        phone_number: '',
        instagram_link: '',
        email: '',
        nome_lead: '',
        faturamento: '',
        principal_dor: '',
        nicho: '',
        nome_dono: '',
        socios: [],
        meeting_date: '',
        notes: '',
        lead_score: 50,
        channel_id: '',
        no_show: false,
      });
    }
  }, [lead, isNew, open]);

  const handleSave = async () => {
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
      lead_score: formData.lead_score,
      channel_id: formData.channel_id || null,
      no_show: formData.no_show,
    };

    try {
      if (isNew) {
        const { error } = await supabase.from('inbound_leads').insert({
          ...dataToSave,
          user_id: user.id,
          status: 'form_filled',
        });
        if (error) throw error;
        toast.success('Lead criado!');
      } else if (lead) {
        const { error } = await supabase
          .from('inbound_leads')
          .update(dataToSave)
          .eq('id', lead.id);
        if (error) throw error;
        toast.success('Lead atualizado!');
      }
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar lead');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!lead) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('inbound_leads')
        .delete()
        .eq('id', lead.id);
      if (error) throw error;
      toast.success('Lead excluído!');
      setShowDeleteConfirm(false);
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
    setLoading(false);
  };

  const handleAddSocio = () => {
    setFormData({ ...formData, socios: [...formData.socios, ''] });
  };

  const handleRemoveSocio = (index: number) => {
    const newSocios = formData.socios.filter((_, i) => i !== index);
    setFormData({ ...formData, socios: newSocios });
  };

  const selectedChannel = channels.find(c => c.id === formData.channel_id);

  return (
    <>
      <DetailPanel
        open={open}
        onClose={onClose}
        title={isNew ? 'Novo Lead' : 'Detalhes do Lead'}
        subtitle={!isNew && lead ? `Criado em ${format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : undefined}
        width="xl"
        actions={
          <div className="flex items-center justify-between gap-4">
            {!isNew && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : isNew ? 'Criar Lead' : 'Salvar'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Lead Score Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Lead Score</Label>
                <p className="text-sm text-muted-foreground">
                  Avalie a qualidade deste lead
                </p>
              </div>
              <LeadScoreBadge score={formData.lead_score} showLabel size="lg" />
            </div>
            <Slider
              value={[formData.lead_score]}
              onValueChange={(value) => setFormData({ ...formData, lead_score: value[0] })}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🔴 Fora do Perfil</span>
              <span>🟠 Nutrição</span>
              <span>🟡 Bom</span>
              <span>🟢 Quente</span>
            </div>
          </div>

          {/* Channel Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Canal de Origem
            </Label>
            <Select
              value={formData.channel_id}
              onValueChange={(value) => setFormData({ ...formData, channel_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canal de origem">
                  {selectedChannel && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedChannel.color }}
                      />
                      {selectedChannel.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="">Nenhum</SelectItem>
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

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Informações de Contato
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Telefone
                </Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="w-3 h-3" /> Instagram
                </Label>
                <Input
                  value={formData.instagram_link}
                  onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome da Empresa/Lead</Label>
                <Input
                  value={formData.nome_lead}
                  onChange={(e) => setFormData({ ...formData, nome_lead: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Proprietário</Label>
                <Input
                  value={formData.nome_dono}
                  onChange={(e) => setFormData({ ...formData, nome_dono: e.target.value })}
                  placeholder="Nome do dono"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Nicho
                </Label>
                <Input
                  value={formData.nicho}
                  onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
                  placeholder="Ex: E-commerce, Saúde..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Informações do Negócio
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Faturamento</Label>
                <Input
                  value={formData.faturamento}
                  onChange={(e) => setFormData({ ...formData, faturamento: e.target.value })}
                  placeholder="Ex: 50k, 100k..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Data da Reunião
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                />
              </div>
            </div>

            {/* No-Show Checkbox - only show when meeting is scheduled */}
            {formData.meeting_date && (
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Checkbox
                  id="no_show"
                  checked={formData.no_show}
                  onCheckedChange={(checked) => setFormData({ ...formData, no_show: !!checked })}
                />
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-orange-500" />
                  <Label htmlFor="no_show" className="text-sm font-medium cursor-pointer">
                    Lead não compareceu (No-Show)
                  </Label>
                </div>
              </div>
            )}

            {/* Sócios */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sócios</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddSocio}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {formData.socios.map((socio, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={socio}
                    onChange={(e) => {
                      const newSocios = [...formData.socios];
                      newSocios[index] = e.target.value;
                      setFormData({ ...formData, socios: newSocios });
                    }}
                    placeholder={`Sócio ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSocio(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Anotações
            </h3>

            <div className="space-y-2">
              <Label>Principal Dor</Label>
              <Textarea
                value={formData.principal_dor}
                onChange={(e) => setFormData({ ...formData, principal_dor: e.target.value })}
                placeholder="Qual a principal dificuldade do lead?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </DetailPanel>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
