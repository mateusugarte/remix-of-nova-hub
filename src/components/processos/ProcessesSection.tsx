import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, Edit, Tag, GripVertical, X, Target } from 'lucide-react';

interface ProcessTag {
  id: string;
  name: string;
  color: string;
}

interface ProcessPhase {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface Process {
  id: string;
  title: string;
  description: string | null;
  phases: ProcessPhase[];
  tags: ProcessTag[];
}

export default function ProcessesSection() {
  const { user } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [tags, setTags] = useState<ProcessTag[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [deleteProcess, setDeleteProcess] = useState<Process | null>(null);
  
  // Form states
  const [processTitle, setProcessTitle] = useState('');
  const [processDescription, setProcessDescription] = useState('');
  const [processPhases, setProcessPhases] = useState<{ name: string; description: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#93153B');

  useEffect(() => {
    if (user) {
      fetchProcesses();
      fetchTags();
    }
  }, [user]);

  const fetchProcesses = async () => {
    try {
      const { data: processData, error } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processesWithDetails: Process[] = [];
      
      for (const process of processData || []) {
        const { data: phases } = await supabase
          .from('process_phases')
          .select('*')
          .eq('process_id', process.id)
          .order('order_index');

        const { data: tagRelations } = await supabase
          .from('process_tag_relations')
          .select('tag_id')
          .eq('process_id', process.id);

        const tagIds = tagRelations?.map(r => r.tag_id) || [];
        const { data: processTags } = await supabase
          .from('process_tags')
          .select('*')
          .in('id', tagIds.length > 0 ? tagIds : ['none']);

        processesWithDetails.push({
          id: process.id,
          title: process.title,
          description: process.description,
          phases: phases || [],
          tags: processTags || [],
        });
      }

      setProcesses(processesWithDetails);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Erro ao carregar processos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('process_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleOpenProcessDialog = (process?: Process) => {
    if (process) {
      setEditingProcess(process);
      setProcessTitle(process.title);
      setProcessDescription(process.description || '');
      setProcessPhases(process.phases.map(p => ({ name: p.name, description: p.description || '' })));
      setSelectedTags(process.tags.map(t => t.id));
    } else {
      setEditingProcess(null);
      setProcessTitle('');
      setProcessDescription('');
      setProcessPhases([{ name: '', description: '' }]);
      setSelectedTags([]);
    }
    setShowProcessDialog(true);
  };

  const handleSaveProcess = async () => {
    if (!user || !processTitle.trim()) return;

    try {
      if (editingProcess) {
        // Update process
        const { error: processError } = await supabase
          .from('processes')
          .update({ title: processTitle, description: processDescription })
          .eq('id', editingProcess.id);

        if (processError) throw processError;

        // Delete old phases and relations
        await supabase.from('process_phases').delete().eq('process_id', editingProcess.id);
        await supabase.from('process_tag_relations').delete().eq('process_id', editingProcess.id);

        // Insert new phases
        const phasesToInsert = processPhases
          .filter(p => p.name.trim())
          .map((p, index) => ({
            process_id: editingProcess.id,
            name: p.name,
            description: p.description || null,
            order_index: index,
          }));

        if (phasesToInsert.length > 0) {
          await supabase.from('process_phases').insert(phasesToInsert);
        }

        // Insert new tag relations
        const tagRelations = selectedTags.map(tagId => ({
          process_id: editingProcess.id,
          tag_id: tagId,
        }));

        if (tagRelations.length > 0) {
          await supabase.from('process_tag_relations').insert(tagRelations);
        }

        toast.success('Processo atualizado!');
      } else {
        // Create new process
        const { data: newProcess, error: processError } = await supabase
          .from('processes')
          .insert({
            user_id: user.id,
            title: processTitle,
            description: processDescription || null,
          })
          .select()
          .single();

        if (processError) throw processError;

        // Insert phases
        const phasesToInsert = processPhases
          .filter(p => p.name.trim())
          .map((p, index) => ({
            process_id: newProcess.id,
            name: p.name,
            description: p.description || null,
            order_index: index,
          }));

        if (phasesToInsert.length > 0) {
          await supabase.from('process_phases').insert(phasesToInsert);
        }

        // Insert tag relations
        const tagRelations = selectedTags.map(tagId => ({
          process_id: newProcess.id,
          tag_id: tagId,
        }));

        if (tagRelations.length > 0) {
          await supabase.from('process_tag_relations').insert(tagRelations);
        }

        toast.success('Processo criado!');
      }

      setShowProcessDialog(false);
      fetchProcesses();
    } catch (error) {
      console.error('Error saving process:', error);
      toast.error('Erro ao salvar processo');
    }
  };

  const handleDeleteProcess = async () => {
    if (!deleteProcess) return;

    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', deleteProcess.id);

      if (error) throw error;

      toast.success('Processo excluído!');
      setDeleteProcess(null);
      fetchProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
      toast.error('Erro ao excluir processo');
    }
  };

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) return;

    try {
      const { error } = await supabase
        .from('process_tags')
        .insert({
          user_id: user.id,
          name: newTagName,
          color: newTagColor,
        });

      if (error) throw error;

      toast.success('Etiqueta criada!');
      setNewTagName('');
      setNewTagColor('#93153B');
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar etiqueta');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('process_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Etiqueta excluída!');
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Erro ao excluir etiqueta');
    }
  };

  const addPhase = () => {
    setProcessPhases([...processPhases, { name: '', description: '' }]);
  };

  const removePhase = (index: number) => {
    setProcessPhases(processPhases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...processPhases];
    updated[index][field] = value;
    setProcessPhases(updated);
  };

  const toggleTagSelection = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Processos</h2>
          <p className="text-sm text-muted-foreground">Defina e organize seus processos de trabalho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTagDialog(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Etiquetas
          </Button>
          <Button onClick={() => handleOpenProcessDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Process List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {processes.map((process, index) => (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{process.title}</CardTitle>
                      {process.description && (
                        <p className="text-sm text-muted-foreground">{process.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenProcessDialog(process)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProcess(process)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {process.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {process.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          style={{ backgroundColor: tag.color }}
                          className="text-white text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                {process.phases.length > 0 && (
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="phases" className="border-none">
                        <AccordionTrigger className="text-sm py-2">
                          {process.phases.length} fase(s)
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {process.phases.map((phase, phaseIndex) => (
                              <div
                                key={phase.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                              >
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                  {phaseIndex + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{phase.name}</p>
                                  {phase.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {phase.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {processes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum processo criado ainda</p>
              <Button className="mt-4" onClick={() => handleOpenProcessDialog()}>
                Criar primeiro processo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProcess ? 'Editar Processo' : 'Novo Processo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={processTitle}
                onChange={(e) => setProcessTitle(e.target.value)}
                placeholder="Nome do processo"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                placeholder="Descrição do processo (opcional)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                    onClick={() => toggleTagSelection(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma etiqueta criada</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Fases</label>
                <Button variant="outline" size="sm" onClick={addPhase}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Fase
                </Button>
              </div>

              <div className="space-y-3">
                {processPhases.map((phase, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 rounded-lg border bg-secondary/30">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-2">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(index, 'name', e.target.value)}
                        placeholder="Nome da fase"
                      />
                      <Textarea
                        value={phase.description}
                        onChange={(e) => updatePhase(index, 'description', e.target.value)}
                        placeholder="Descrição da fase (opcional)"
                        rows={2}
                      />
                    </div>
                    {processPhases.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhase(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProcess} disabled={!processTitle.trim()}>
              {editingProcess ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Etiquetas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nova etiqueta"
                className="flex-1"
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="h-12 w-12 rounded-lg border cursor-pointer"
              />
              <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                >
                  <Badge style={{ backgroundColor: tag.color }} className="text-white">
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma etiqueta criada
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProcess} onOpenChange={() => setDeleteProcess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcess}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
