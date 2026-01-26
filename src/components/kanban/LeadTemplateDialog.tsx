import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

interface LeadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: LeadTemplate | null;
  onSave: () => void;
}

export default function LeadTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: LeadTemplateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setFields(template.fields || []);
    } else {
      setName('');
      setDescription('');
      setFields([
        { id: crypto.randomUUID(), name: 'faturamento', label: 'Faturamento', type: 'text', scoreWeight: 20 },
        { id: crypto.randomUUID(), name: 'nicho', label: 'Nicho', type: 'text', scoreWeight: 15 },
        { id: crypto.randomUUID(), name: 'numero_funcionarios', label: 'Nº de Funcionários', type: 'number', scoreWeight: 10 },
        { id: crypto.randomUUID(), name: 'urgencia', label: 'Urgência', type: 'select', options: ['Baixa', 'Média', 'Alta', 'Urgente'], scoreWeight: 25 },
        { id: crypto.randomUUID(), name: 'orcamento', label: 'Orçamento Disponível', type: 'select', options: ['Até 5k', '5k-15k', '15k-50k', 'Acima de 50k'], scoreWeight: 30 },
      ]);
    }
  }, [template, open]);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        name: `campo_${fields.length + 1}`,
        label: `Novo Campo ${fields.length + 1}`,
        type: 'text',
        scoreWeight: 0,
      },
    ]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    const data = {
      name: name.trim(),
      description: description.trim() || null,
      fields: JSON.parse(JSON.stringify(fields)),
      user_id: user.id,
    };

    if (template) {
      const { error } = await supabase
        .from('lead_templates')
        .update(data)
        .eq('id', template.id);

      if (error) {
        toast({ title: 'Erro ao atualizar template', variant: 'destructive' });
      } else {
        toast({ title: 'Template atualizado!' });
        onOpenChange(false);
        onSave();
      }
    } else {
      const { error } = await supabase.from('lead_templates').insert([data]);

      if (error) {
        toast({ title: 'Erro ao criar template', variant: 'destructive' });
      } else {
        toast({ title: 'Template criado!' });
        onOpenChange(false);
        onSave();
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {template ? 'Editar Template de Lead' : 'Novo Template de Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lead de E-commerce"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Campos Personalizados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Campo
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-secondary/20"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-3 cursor-grab" />
                  
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome do Campo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { 
                          label: e.target.value,
                          name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                        })}
                        placeholder="Nome"
                        className="h-9"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value as any })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="textarea">Área de Texto</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Peso Score (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.scoreWeight || 0}
                        onChange={(e) => updateField(field.id, { scoreWeight: parseInt(e.target.value) || 0 })}
                        className="h-9"
                      />
                    </div>

                    {field.type === 'select' && (
                      <div className="space-y-1 col-span-4">
                        <Label className="text-xs text-muted-foreground">Opções (separadas por vírgula)</Label>
                        <Input
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(field.id, { 
                            options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                          })}
                          placeholder="Opção 1, Opção 2, Opção 3"
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              O peso de cada campo define quanto ele contribui para o Lead Score (0-100 pontos).
              A soma dos pesos deve ser 100% para pontuação máxima.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Salvando...' : template ? 'Salvar' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
