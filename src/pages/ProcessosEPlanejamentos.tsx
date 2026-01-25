import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp } from 'lucide-react';
import ProcessesSection from '@/components/processos/ProcessesSection';
import PlanningSection from '@/components/processos/PlanningSection';

export default function ProcessosEPlanejamentos() {
  const [activeTab, setActiveTab] = useState('processos');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display text-foreground tracking-wide">
          Processos e Planejamentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus processos, metas mensais e produtos
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="processos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="planejamentos" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Planejamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processos" className="space-y-6">
          <ProcessesSection />
        </TabsContent>

        <TabsContent value="planejamentos" className="space-y-6">
          <PlanningSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
