import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  UserCheck,
  Package,
  Brain,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Target,
  TrendingUp,
  Megaphone,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Postagens', href: '/postagens', icon: FileText },
  { name: 'Prospecção', href: '/prospeccao', icon: Users },
  { name: 'Leads Inbound', href: '/leads-inbound', icon: TrendingUp },
  { name: 'Tráfego Pago', href: '/trafego-pago', icon: Megaphone },
  { name: 'Clientes', href: '/clientes', icon: UserCheck },
  { name: 'Implementações', href: '/implementacoes', icon: Package },
  { name: 'Processos', href: '/processos', icon: Target },
  { name: 'Pensamentos', href: '/pensamentos', icon: Brain },
];

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const shouldExpand = isExpanded || isHovering;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 bg-sidebar border-r border-sidebar-border",
          "flex flex-col transition-all duration-300 ease-out"
        )}
        initial={false}
        animate={{ width: shouldExpand ? 240 : 64 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 min-w-[40px] rounded-xl overflow-hidden border border-sidebar-border">
              <img src={logo} alt="GetMore Logo" className="h-full w-full object-cover" />
            </div>
            <AnimatePresence>
              {shouldExpand && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  <h1 className="text-lg font-display text-sidebar-foreground tracking-wider">GETMORE</h1>
                  <p className="text-xs text-muted-foreground -mt-1">Sistema de Gestão</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.href)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <item.icon className="h-5 w-5 min-w-[20px]" />
                        <AnimatePresence>
                          {shouldExpand && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.15 }}
                              className="whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </TooltipTrigger>
                    {!shouldExpand && (
                      <TooltipContent side="right" sideOffset={10}>
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
          
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                )}
              >
                <LogOut className="h-5 w-5 min-w-[20px]" />
                <AnimatePresence>
                  {shouldExpand && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap"
                    >
                      Sair
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {!shouldExpand && (
              <TooltipContent side="right" sideOffset={10}>
                Sair
              </TooltipContent>
            )}
          </Tooltip>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm",
              "text-muted-foreground hover:bg-sidebar-accent transition-colors"
            )}
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <AnimatePresence>
              {shouldExpand && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-xs"
                >
                  {isExpanded ? 'Recolher' : 'Fixar aberto'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main 
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          shouldExpand ? "ml-[240px]" : "ml-16"
        )}
      >
        <motion.div 
          className="p-6 lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
