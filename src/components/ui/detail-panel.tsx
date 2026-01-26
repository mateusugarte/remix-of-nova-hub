import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  actions?: ReactNode;
}

const widthClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export default function DetailPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  width = 'lg',
  actions,
}: DetailPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 h-full z-50 bg-card border-l border-border shadow-2xl flex flex-col',
              widthClasses[width],
              'w-full',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="space-y-1">
                {title && (
                  <h2 className="text-xl font-display font-semibold tracking-wide text-foreground">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive -mt-1 -mr-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">{children}</div>
            </ScrollArea>

            {/* Actions Footer */}
            {actions && (
              <div className="p-4 border-t border-border/50 bg-secondary/20">
                {actions}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
