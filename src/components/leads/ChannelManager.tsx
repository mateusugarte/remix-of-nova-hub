import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Tag } from 'lucide-react';

export interface LeadChannel {
  id: string;
  name: string;
  color: string;
}

interface ChannelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelsUpdate: () => void;
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function ChannelManager({
  open,
  onOpenChange,
  onChannelsUpdate,
}: ChannelManagerProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<LeadChannel[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchChannels();
    }
  }, [open, user]);

  const fetchChannels = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('lead_channels')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    setChannels(data || []);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('lead_channels')
          .update({ name: name.trim(), color })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Canal atualizado!');
      } else {
        const { error } = await supabase
          .from('lead_channels')
          .insert({ user_id: user.id, name: name.trim(), color });
        if (error) throw error;
        toast.success('Canal criado!');
      }

      setName('');
      setColor(PRESET_COLORS[0]);
      setEditingId(null);
      fetchChannels();
      onChannelsUpdate();
    } catch (error) {
      toast.error('Erro ao salvar canal');
    }
    setLoading(false);
  };

  const handleEdit = (channel: LeadChannel) => {
    setEditingId(channel.id);
    setName(channel.name);
    setColor(channel.color);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Canal excluído!');
      fetchChannels();
      onChannelsUpdate();
    } catch (error) {
      toast.error('Erro ao excluir canal');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setColor(PRESET_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Gerenciar Canais de Origem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Instagram Ads, Google, Indicação..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {editingId && (
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={loading || !name.trim()} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Canais Existentes</Label>
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum canal criado ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(channel)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(channel.id)}
                        className="h-8 w-8 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
