import { cn } from '@/lib/utils';

interface LeadScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function getScoreCategory(score: number) {
  if (score >= 80) return { label: 'LEAD QUENTE', sublabel: 'ICP IDEAL', color: 'bg-green-500', textColor: 'text-green-500', emoji: '🟢' };
  if (score >= 60) return { label: 'LEAD BOM', sublabel: 'AJUSTE DE DISCURSO', color: 'bg-yellow-500', textColor: 'text-yellow-500', emoji: '🟡' };
  if (score >= 40) return { label: 'EM NUTRIÇÃO', sublabel: 'LEAD EM NUTRIÇÃO', color: 'bg-orange-500', textColor: 'text-orange-500', emoji: '🟠' };
  return { label: 'FORA DO PERFIL', sublabel: 'FORA DO PERFIL', color: 'bg-red-500', textColor: 'text-red-500', emoji: '🔴' };
}

export default function LeadScoreBadge({ score, showLabel = false, size = 'md' }: LeadScoreBadgeProps) {
  const category = getScoreCategory(score);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      sizeClasses[size],
      category.color,
      'text-white'
    )}>
      <span>{category.emoji}</span>
      <span>{score} pts</span>
      {showLabel && <span className="hidden sm:inline">- {category.label}</span>}
    </div>
  );
}
