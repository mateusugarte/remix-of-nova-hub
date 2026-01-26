import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import LeadScoreBadge, { getScoreCategory } from './LeadScoreBadge';

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

interface LeadFormData {
  phone_number: string;
  instagram_link: string;
  email: string;
  nome_lead: string;
  faturamento: string;
  principal_dor: string;
  nicho: string;
  nome_dono: string;
  socios: string[];
  meeting_date: string;
  notes: string;
  lead_score: number;
  template_id: string | null;
  custom_fields: Record<string, any>;
}

interface LeadFormDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => void;
  onDelete?: () => void;
  title: string;
  isEditing?: boolean;
  loading?: boolean;
  templates: LeadTemplate[];
  onManageTemplates: () => void;
}

export default function LeadFormDialogEnhanced({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  title,
  isEditing = false,
  loading = false,
  templates,
  onManageTemplates,
}: LeadFormDialogEnhancedProps) {
  const [formData, setFormData] = useState<LeadFormData>({
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
    template_id: null,
    custom_fields: {},
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LeadTemplate | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        phone_number: initialData.phone_number || '',
        instagram_link: initialData.instagram_link || '',
        email: initialData.email || '',
        nome_lead: initialData.nome_lead || '',
        faturamento: initialData.faturamento || '',
        principal_dor: initialData.principal_dor || '',
        nicho: initialData.nicho || '',
        nome_dono: initialData.nome_dono || '',
        socios: initialData.socios || [],
        meeting_date: initialData.meeting_date || '',
        notes: initialData.notes || '',
        lead_score: initialData.lead_score || 50,
        template_id: initialData.template_id || null,
        custom_fields: initialData.custom_fields || {},
      });
      
      if (initialData.template_id) {
        const template = templates.find(t => t.id === initialData.template_id);
        setSelectedTemplate(template || null);
      }
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
        template_id: null,
        custom_fields: {},
      });
      setSelectedTemplate(null);
    }
  }, [initialData, open, templates]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData({ ...formData, template_id: templateId, custom_fields: {} });
  };

  const handleAddSocio = () => {
    setFormData({ ...formData, socios: [...formData.socios, ''] });
  };

  const handleRemoveSocio = (index: number) => {
    const newSocios = formData.socios.filter((_, i) => i !== index);
    setFormData({ ...formData, socios: newSocios });
  };

  const handleSocioChange = (index: number, value: string) => {
    const newSocios = [...formData.socios];
    newSocios[index] = value;
    setFormData({ ...formData, socios: newSocios });
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      custom_fields: { ...formData.custom_fields, [fieldName]: value },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const scoreCategory = getScoreCategory(formData.lead_score);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lead Score Section */}
            <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Lead Score</Label>
                <LeadScoreBadge score={formData.lead_score} showLabel size="md" />
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

            {/* Template Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Modelo de Lead</Label>
                <Button type="button" variant="ghost" size="sm" onClick={onManageTemplates}>
                  <Settings2 className="w-4 h-4 mr-1" />
                  Gerenciar Templates
                </Button>
              </div>
              <Select
                value={formData.template_id || ''}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram_link}
                  onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Lead/Empresa</Label>
                <Input
                  value={formData.nome_lead}
                  onChange={(e) => setFormData({ ...formData, nome_lead: e.target.value })}
                  placeholder="Nome da empresa/lead"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Dono/Contato</Label>
                <Input
                  value={formData.nome_dono}
                  onChange={(e) => setFormData({ ...formData, nome_dono: e.target.value })}
                  placeholder="Nome do proprietário"
                />
              </div>
              <div className="space-y-2">
                <Label>Nicho</Label>
                <Input
                  value={formData.nicho}
                  onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
                  placeholder="Ex: E-commerce, Saúde..."
                />
              </div>
            </div>

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
                <Label>Data da Reunião</Label>
                <Input
                  type="datetime-local"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                />
              </div>
            </div>

            {/* Custom Template Fields */}
            {selectedTemplate && selectedTemplate.fields.length > 0 && (
              <div className="space-y-4 border-t border-border/50 pt-4">
                <Label className="text-base font-medium text-primary">
                  Campos do Template: {selectedTemplate.name}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {field.label}
                        {field.scoreWeight && field.scoreWeight > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({field.scoreWeight}% score)
                          </span>
                        )}
                      </Label>
                      {field.type === 'text' && (
                        <Input
                          value={formData.custom_fields[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          placeholder={field.label}
                        />
                      )}
                      {field.type === 'number' && (
                        <Input
                          type="number"
                          value={formData.custom_fields[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          placeholder={field.label}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <Textarea
                          value={formData.custom_fields[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          placeholder={field.label}
                          rows={2}
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <Select
                          value={formData.custom_fields[field.name] || ''}
                          onValueChange={(value) => handleCustomFieldChange(field.name, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecione ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border z-50">
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
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
                    onChange={(e) => handleSocioChange(index, e.target.value)}
                    placeholder={`Nome do sócio ${index + 1}`}
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

            <div className="space-y-2">
              <Label>Principal Dor</Label>
              <Textarea
                value={formData.principal_dor}
                onChange={(e) => setFormData({ ...formData, principal_dor: e.target.value })}
                placeholder="Qual a principal dificuldade do lead?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Anotações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações gerais..."
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/50">
              {isEditing && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
