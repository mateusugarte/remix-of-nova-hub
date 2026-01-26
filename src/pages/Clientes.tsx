import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DetailPanel from '@/components/ui/detail-panel';
import {
  Plus, Trash2, Edit, Users, DollarSign, Calendar, Tag,
  Phone, Mail, Instagram, Package, CreditCard, Check,
  TrendingUp, AlertCircle, Clock, UserPlus
} from 'lucide-react';
import { format, parseISO, addMonths, isBefore, isAfter, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProcessTag {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ClientPayment {
  id: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  notes: string | null;
  product_id: string | null;
  current_phase_id: string | null;
  contract_value: number;
  recurrence_value: number;
  start_date: string | null;
  created_at: string;
  product?: Product;
  phase?: ProcessTag;
  payments?: ClientPayment[];
}

export default function Clientes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [phases, setPhases] = useState<ProcessTag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Dialog states
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  // Client form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientInstagram, setClientInstagram] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientProductId, setClientProductId] = useState('');
  const [clientPhaseId, setClientPhaseId] = useState('');
  const [clientContractValue, setClientContractValue] = useState('');
  const [clientRecurrenceValue, setClientRecurrenceValue] = useState('');
  const [clientStartDate, setClientStartDate] = useState('');

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [generateRecurringPayments, setGenerateRecurringPayments] = useState(false);
  const [recurringMonths, setRecurringMonths] = useState('12');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchPhases(), fetchProducts()]);
    setLoading(false);
  };

  const fetchClients = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      const clientsWithDetails: Client[] = [];
      for (const client of clientsData || []) {
        const { data: payments } = await supabase
          .from('client_payments')
          .select('*')
          .eq('client_id', client.id)
          .order('due_date');

        let product, phase;
        if (client.product_id) {
          const { data } = await supabase.from('products').select('id, name, price').eq('id', client.product_id).single();
          product = data || undefined;
        }
        if (client.current_phase_id) {
          const { data } = await supabase.from('process_tags').select('*').eq('id', client.current_phase_id).single();
          phase = data || undefined;
        }

        clientsWithDetails.push({
          ...client,
          product,
          phase,
          payments: payments || [],
        });
      }
      setClients(clientsWithDetails);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchPhases = async () => {
    try {
      // Get tags from processes marked as client processes
      const { data: clientProcesses } = await supabase
        .from('processes')
        .select('id')
        .eq('is_client_process', true);

      if (!clientProcesses || clientProcesses.length === 0) {
        // Fallback: get all tags if no client processes defined
        const { data } = await supabase.from('process_tags').select('*').order('name');
        setPhases(data || []);
        return;
      }

      const processIds = clientProcesses.map(p => p.id);
      const { data: tagRelations } = await supabase
        .from('process_tag_relations')
        .select('tag_id')
        .in('process_id', processIds);

      const tagIds = [...new Set(tagRelations?.map(r => r.tag_id) || [])];
      
      if (tagIds.length === 0) {
        const { data } = await supabase.from('process_tags').select('*').order('name');
        setPhases(data || []);
        return;
      }

      const { data } = await supabase.from('process_tags').select('*').in('id', tagIds).order('name');
      setPhases(data || []);
    } catch (error) {
      console.error('Error fetching phases:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('id, name, price').order('name');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Dashboard metrics
  const totalClients = clients.length;
  const totalMRR = clients.reduce((sum, c) => sum + (c.recurrence_value || 0), 0);
  const totalContractValue = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0);
  
  const allPayments = clients.flatMap(c => c.payments || []);
  const pendingPayments = allPayments.filter(p => !p.is_paid && isBefore(parseISO(p.due_date), new Date()));
  const upcomingPayments = allPayments.filter(p => !p.is_paid && isAfter(parseISO(p.due_date), new Date()));
  const paidThisMonth = allPayments.filter(p => 
    p.is_paid && 
    p.paid_at && 
    isAfter(parseISO(p.paid_at), startOfMonth(new Date()))
  );
  const receivedThisMonth = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Client handlers
  const handleOpenClientDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.name);
      setClientPhone(client.phone || '');
      setClientEmail(client.email || '');
      setClientInstagram(client.instagram || '');
      setClientNotes(client.notes || '');
      setClientProductId(client.product_id || '');
      setClientPhaseId(client.current_phase_id || '');
      setClientContractValue(client.contract_value?.toString() || '0');
      setClientRecurrenceValue(client.recurrence_value?.toString() || '0');
      setClientStartDate(client.start_date || '');
    } else {
      setEditingClient(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientInstagram('');
      setClientNotes('');
      setClientProductId('');
      setClientPhaseId('');
      setClientContractValue('');
      setClientRecurrenceValue('');
      setClientStartDate('');
    }
    setShowClientDialog(true);
  };

  const handleSaveClient = async () => {
    if (!user || !clientName.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      const clientData = {
        name: clientName,
        phone: clientPhone || null,
        email: clientEmail || null,
        instagram: clientInstagram || null,
        notes: clientNotes || null,
        product_id: clientProductId || null,
        current_phase_id: clientPhaseId || null,
        contract_value: parseFloat(clientContractValue) || 0,
        recurrence_value: parseFloat(clientRecurrenceValue) || 0,
        start_date: clientStartDate || null,
      };

      if (editingClient) {
        await supabase.from('clients').update(clientData).eq('id', editingClient.id);
        toast.success('Cliente atualizado!');
      } else {
        await supabase.from('clients').insert({ ...clientData, user_id: user.id });
        toast.success('Cliente criado!');
      }

      setShowClientDialog(false);
      fetchClients();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    try {
      await supabase.from('clients').delete().eq('id', deleteClientId);
      toast.success('Cliente excluído!');
      setDeleteClientId(null);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  // Payment handlers
  const handleOpenPaymentDialog = () => {
    setPaymentAmount(selectedClient?.recurrence_value?.toString() || '');
    setPaymentDueDate('');
    setPaymentNotes('');
    setGenerateRecurringPayments(false);
    setRecurringMonths('12');
    setShowPaymentDialog(true);
  };

  const handleSavePayment = async () => {
    if (!selectedClient || !paymentDueDate) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    try {
      if (generateRecurringPayments) {
        const months = parseInt(recurringMonths) || 1;
        const payments = [];
        for (let i = 0; i < months; i++) {
          payments.push({
            client_id: selectedClient.id,
            amount: parseFloat(paymentAmount) || 0,
            due_date: format(addMonths(parseISO(paymentDueDate), i), 'yyyy-MM-dd'),
            notes: paymentNotes || null,
          });
        }
        await supabase.from('client_payments').insert(payments);
        toast.success(`${months} pagamentos criados!`);
      } else {
        await supabase.from('client_payments').insert({
          client_id: selectedClient.id,
          amount: parseFloat(paymentAmount) || 0,
          due_date: paymentDueDate,
          notes: paymentNotes || null,
        });
        toast.success('Pagamento criado!');
      }

      setShowPaymentDialog(false);
      fetchClients();
    } catch (error) {
      toast.error('Erro ao criar pagamento');
    }
  };

  const handleTogglePayment = async (paymentId: string, isPaid: boolean) => {
    try {
      await supabase.from('client_payments').update({
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      }).eq('id', paymentId);
      toast.success(isPaid ? 'Pagamento confirmado!' : 'Pagamento desmarcado');
      fetchClients();
    } catch (error) {
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await supabase.from('client_payments').delete().eq('id', paymentId);
      toast.success('Pagamento excluído!');
      fetchClients();
    } catch (error) {
      toast.error('Erro ao excluir pagamento');
    }
  };

  const handleUpdatePhase = async (clientId: string, phaseId: string) => {
    try {
      await supabase.from('clients').update({ current_phase_id: phaseId || null }).eq('id', clientId);
      toast.success('Fase atualizada!');
      fetchClients();
    } catch (error) {
      toast.error('Erro ao atualizar fase');
    }
  };

  // Update selectedClient when clients change
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients]);

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display text-foreground tracking-wide">Clientes</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus clientes, contratos e pagamentos</p>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMRR)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recebido (Mês)</p>
                <p className="text-2xl font-bold">{formatCurrency(receivedThisMonth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lista de Clientes</h2>
        <Button onClick={() => handleOpenClientDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {clients.map((client, index) => {
              const clientPayments = client.payments || [];
              const overdueCount = clientPayments.filter(p => !p.is_paid && isBefore(parseISO(p.due_date), new Date())).length;
              const paidCount = clientPayments.filter(p => p.is_paid).length;
              const totalPayments = clientPayments.length;

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{client.name}</h4>
                            {client.product && (
                              <p className="text-sm text-muted-foreground">{client.product.name}</p>
                            )}
                          </div>
                        </div>
                        {client.phase && (
                          <Badge style={{ backgroundColor: client.phase.color }} className="text-white text-xs">
                            {client.phase.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Recorrência</p>
                          <p className="font-semibold text-green-500">{formatCurrency(client.recurrence_value || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Pagamentos</p>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">{paidCount}</span>
                            <span>/</span>
                            <span>{totalPayments}</span>
                            {overdueCount > 0 && (
                              <Badge variant="destructive" className="text-xs">{overdueCount} atrasado(s)</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado</p>
            <Button onClick={() => handleOpenClientDialog()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar primeiro cliente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Client Detail Panel */}
      <DetailPanel
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || ''}
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenClientDialog(selectedClient)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteClientId(selectedClient.id)}>
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Excluir
              </Button>
            </div>

            {/* Phase Selector */}
            <div className="space-y-2">
              <Label>Fase Atual</Label>
              <Select 
                value={selectedClient.current_phase_id || ''} 
                onValueChange={(v) => handleUpdatePhase(selectedClient.id, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma fase" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Nenhuma</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} />
                        {phase.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold">Informações</h4>
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedClient.phone}
                  </div>
                )}
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedClient.email}
                  </div>
                )}
                {selectedClient.instagram && (
                  <div className="flex items-center gap-2 text-sm">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    {selectedClient.instagram}
                  </div>
                )}
                {selectedClient.product && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {selectedClient.product.name}
                  </div>
                )}
                {selectedClient.start_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Cliente desde {format(parseISO(selectedClient.start_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Contrato</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedClient.contract_value || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Recorrência</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(selectedClient.recurrence_value || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Pagamentos</h4>
                <Button size="sm" onClick={handleOpenPaymentDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {(selectedClient.payments?.length || 0) > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedClient.payments?.map(payment => {
                    const isOverdue = !payment.is_paid && isBefore(parseISO(payment.due_date), new Date());
                    return (
                      <div
                        key={payment.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          payment.is_paid 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : isOverdue 
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-secondary/50 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={payment.is_paid}
                            onCheckedChange={(checked) => handleTogglePayment(payment.id, !!checked)}
                          />
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(payment.due_date), 'dd/MM/yyyy')}
                              {payment.is_paid && payment.paid_at && (
                                <span className="text-green-500 ml-2">
                                  (pago em {format(parseISO(payment.paid_at), 'dd/MM')})
                                </span>
                              )}
                              {isOverdue && <span className="text-destructive ml-2">(atrasado)</span>}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePayment(payment.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
              )}
            </div>

            {/* Notes */}
            {selectedClient.notes && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{selectedClient.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DetailPanel>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={clientInstagram} onChange={(e) => setClientInstagram(e.target.value)} placeholder="@usuario" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={clientProductId} onValueChange={setClientProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="">Nenhum</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fase Atual</Label>
                <Select value={clientPhaseId} onValueChange={setClientPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="">Nenhuma</SelectItem>
                    {phases.map(phase => (
                      <SelectItem key={phase.id} value={phase.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} />
                          {phase.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor do Contrato (R$)</Label>
                <Input type="number" value={clientContractValue} onChange={(e) => setClientContractValue(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Valor Recorrência (R$)</Label>
                <Input type="number" value={clientRecurrenceValue} onChange={(e) => setClientRecurrenceValue(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={clientStartDate} onChange={(e) => setClientStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notas sobre o cliente..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveClient}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Adicionar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Opcional" />
            </div>
            <Separator />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={generateRecurringPayments}
                onCheckedChange={(checked) => setGenerateRecurringPayments(!!checked)}
              />
              <Label htmlFor="recurring">Gerar pagamentos recorrentes</Label>
            </div>
            {generateRecurringPayments && (
              <div className="space-y-2">
                <Label>Número de meses</Label>
                <Input type="number" value={recurringMonths} onChange={(e) => setRecurringMonths(e.target.value)} placeholder="12" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <Button onClick={handleSavePayment}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Todos os pagamentos associados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
