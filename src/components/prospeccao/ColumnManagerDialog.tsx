import { useState } from 'react';
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
import { Plus, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react';

export interface ProspectColumn {
  id: string;
  title: string;
  color: string;
  order_index: number;
}

interface ColumnManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ProspectColumn[];
  onAdd: (title: string, color: string) => void;
  onUpdate: (id: string, title: string, color: string) => void;
  onDelete: (id: string) => void;
  onReorder: (columns: ProspectColumn[]) => void;
}

const COLOR_OPTIONS = [
  '#6B7280', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
  '#3B82F6', '#EC4899', '#F97316', '#14B8A6', '#6366F1',
];

export default function ColumnManagerDialog({
  open,
  onOpenChange,
  columns,
  onAdd,
  onUpdate,
  onDelete,
}: ColumnManagerDialogProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim(), newColor);
    setNewTitle('');
    setNewColor('#6B7280');
  };

  const startEdit = (col: ProspectColumn) => {
    setEditingId(col.id);
    setEditTitle(col.title);
    setEditColor(col.color);
  };

  const confirmEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    onUpdate(editingId, editTitle.trim(), editColor);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Gerenciar Colunas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {columns
            .sort((a, b) => a.order_index - b.order_index)
            .map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/50"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: editingId === col.id ? editColor : col.color }}
                />

                {editingId === col.id ? (
                  <>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className="w-4 h-4 rounded-full shrink-0 ring-offset-background transition-all"
                          style={{
                            backgroundColor: c,
                            outline: editColor === c ? '2px solid hsl(var(--primary))' : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={confirmEdit}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium flex-1">{col.title}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => startEdit(col)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onDelete(col.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
        </div>

        {/* Add new column */}
        <div className="border-t border-border/50 pt-4 space-y-3">
          <Label className="text-sm font-medium">Nova Coluna</Label>
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome da coluna"
              className="h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="sm" disabled={!newTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  outline: newColor === c ? '2px solid hsl(var(--primary))' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
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
