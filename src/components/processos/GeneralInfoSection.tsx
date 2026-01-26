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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, Trash2, Edit, Package, Users, DollarSign, Percent,
  TrendingUp, Save, FileText, Target
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  profit_margin: number | null;
  notes: string | null;
}

export default function GeneralInfoSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // Product form
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productMargin, setProductMargin] = useState('');
  const [productNotes, setProductNotes] = useState('');

  // ICP state
  const [icpDescription, setIcpDescription] = useState('');
  const [icpOriginal, setIcpOriginal] = useState('');
  const [savingIcp, setSavingIcp] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchIcp();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  const fetchIcp = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('icp_description')
        .eq('id', user.id)
        .single();
      const icp = data?.icp_description || '';
      setIcpDescription(icp);
      setIcpOriginal(icp);
    } catch (error) {
      console.error('Error fetching ICP:', error);
    }
  };

  // Calculate margin automatically
  const calculateMargin = (price: string, cost: string) => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    if (p > 0 && c > 0) {
      const margin = ((p - c) / p) * 100;
      return margin.toFixed(2);
    }
    return '';
  };

  // Product handlers
  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductDescription(product.description || '');
      setProductPrice(product.price?.toString() || '0');
      setProductCost(product.cost?.toString() || '0');
      setProductMargin(product.profit_margin?.toString() || '');
      setProductNotes(product.notes || '');
    } else {
      setEditingProduct(null);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductCost('');
      setProductMargin('');
      setProductNotes('');
    }
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!user || !productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    const price = parseFloat(productPrice) || 0;
    const cost = parseFloat(productCost) || 0;

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: productName,
          description: productDescription || null,
          price,
          cost,
          notes: productNotes || null,
        }).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('products').insert({
          user_id: user.id,
          name: productName,
          description: productDescription || null,
          price,
          cost,
          notes: productNotes || null,
        });
        if (error) throw error;
        toast.success('Produto criado!');
      }
      setShowProductDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    try {
      await supabase.from('products').delete().eq('id', deleteProductId);
      toast.success('Produto excluído!');
      setDeleteProductId(null);
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  // ICP handler
  const handleSaveIcp = async () => {
    if (!user) return;
    setSavingIcp(true);
    try {
      await supabase.from('profiles').update({
        icp_description: icpDescription || null,
      }).eq('id', user.id);
      setIcpOriginal(icpDescription);
      toast.success('ICP salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar ICP');
    }
    setSavingIcp(false);
  };

  // Stats
  const totalProducts = products.length;
  const avgPrice = products.length > 0 
    ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
    : 0;
  const avgMargin = products.filter(p => p.profit_margin).length > 0
    ? products.filter(p => p.profit_margin).reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.filter(p => p.profit_margin).length
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="icp" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            ICP
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Produtos</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">{formatCurrency(avgPrice)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Percent className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem Média</p>
                  <p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Seus Produtos</h3>
              <p className="text-sm text-muted-foreground">Gerencie seus produtos, preços e margens</p>
            </div>
            <Button onClick={() => handleOpenProductDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {/* Products List */}
          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:border-primary/50 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenProductDialog(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteProductId(product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Preço</p>
                            <p className="font-semibold text-green-500">{formatCurrency(product.price || 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Custo</p>
                            <p className="font-semibold text-orange-500">{formatCurrency(product.cost || 0)}</p>
                          </div>
                          {product.profit_margin !== null && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Margem</p>
                              <Badge variant={product.profit_margin >= 30 ? 'default' : 'secondary'}>
                                {product.profit_margin.toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </div>

                        {product.notes && (
                          <>
                            <Separator className="my-3" />
                            <p className="text-xs text-muted-foreground line-clamp-2">{product.notes}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
                <Button onClick={() => handleOpenProductDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro produto
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ICP Tab */}
        <TabsContent value="icp" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Perfil do Cliente Ideal (ICP)</CardTitle>
                  <CardDescription>
                    Descreva as características do seu cliente ideal para guiar suas estratégias de marketing e vendas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição do ICP</Label>
                <Textarea
                  value={icpDescription}
                  onChange={(e) => setIcpDescription(e.target.value)}
                  placeholder={`Descreva seu cliente ideal. Considere incluir:

• Segmento/Nicho (ex: e-commerces de moda feminina)
• Faturamento mensal (ex: R$ 50k - R$ 500k/mês)
• Tamanho da equipe
• Principais dores e desafios
• O que buscam em uma solução
• Características demográficas do decisor
• Comportamentos e canais que utilizam
• Objeções comuns e como superá-las`}
                  rows={12}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveIcp}
                  disabled={savingIcp || icpDescription === icpOriginal}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingIcp ? 'Salvando...' : 'Salvar ICP'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ICP Tips */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Dicas para definir seu ICP
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Seja específico:</strong> Quanto mais detalhado, melhor será sua comunicação</li>
                <li>• <strong>Baseie-se em dados:</strong> Analise seus melhores clientes atuais</li>
                <li>• <strong>Inclua dores:</strong> Entender os problemas é fundamental para vender soluções</li>
                <li>• <strong>Atualize regularmente:</strong> Seu ICP pode evoluir com o tempo</li>
                <li>• <strong>Compartilhe com a equipe:</strong> Todos devem conhecer o cliente ideal</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Produto *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Consultoria Premium, Implementação Básica..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Breve descrição do produto ou serviço..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input
                  type="number"
                  value={productPrice}
                  onChange={(e) => {
                    setProductPrice(e.target.value);
                    setProductMargin(calculateMargin(e.target.value, productCost));
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo (R$)</Label>
                <Input
                  type="number"
                  value={productCost}
                  onChange={(e) => {
                    setProductCost(e.target.value);
                    setProductMargin(calculateMargin(productPrice, e.target.value));
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Margem de Lucro (%)</Label>
              <Input
                type="number"
                value={productMargin}
                onChange={(e) => setProductMargin(e.target.value)}
                placeholder="Calculada automaticamente"
              />
              {productPrice && productCost && parseFloat(productPrice) > 0 && parseFloat(productCost) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Lucro: {formatCurrency((parseFloat(productPrice) || 0) - (parseFloat(productCost) || 0))}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="Notas adicionais sobre o produto..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveProduct}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
