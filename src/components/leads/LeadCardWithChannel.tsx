import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Instagram, Calendar, Building2, User, Mail, DollarSign, FileText, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LeadScoreBadge from '@/components/kanban/LeadScoreBadge';
import { LeadChannel } from './ChannelManager';

interface LeadCardWithChannelProps {
  phone_number?: string | null;
  instagram_link?: string | null;
  email?: string | null;
  nome_dono?: string | null;
  nome_lead?: string | null;
  nicho?: string | null;
  faturamento?: string | null;
  principal_dor?: string | null;
  meeting_date?: string | null;
  created_at: string;
  lead_score?: number;
  notes?: string | null;
  channel?: LeadChannel | null;
}

export default function LeadCardWithChannel({
  phone_number,
  instagram_link,
  email,
  nome_dono,
  nome_lead,
  nicho,
  faturamento,
  principal_dor,
  meeting_date,
  created_at,
  lead_score = 0,
  notes,
  channel,
}: LeadCardWithChannelProps) {
  const displayName = nome_dono || nome_lead || (instagram_link ? `@${instagram_link.split('/').pop()}` : phone_number || 'Lead');

  return (
    <Card className="bg-card hover:bg-card/90 transition-all duration-200 border-border/50 hover:border-primary/40 shadow-md hover:shadow-lg">
      <CardContent className="p-4 space-y-3">
        {/* Header with Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-base block truncate">{displayName}</span>
              {nome_lead && nome_dono && (
                <span className="text-xs text-muted-foreground truncate block">{nome_lead}</span>
              )}
            </div>
          </div>
          <LeadScoreBadge score={lead_score} size="sm" />
        </div>

        {/* Channel Tag */}
        {channel && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs gap-1.5 px-2 py-1"
              style={{ 
                borderColor: channel.color, 
                color: channel.color,
                backgroundColor: `${channel.color}10`
              }}
            >
              <Tag className="w-3 h-3" />
              {channel.name}
            </Badge>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-2">
          {phone_number && (
            <Badge variant="outline" className="text-xs gap-1.5 px-2 py-1">
              <Phone className="w-3 h-3" />
              {phone_number}
            </Badge>
          )}
          {instagram_link && (
            <Badge variant="outline" className="text-xs gap-1.5 px-2 py-1">
              <Instagram className="w-3 h-3" />
              @{instagram_link.split('/').pop()?.slice(0, 15)}
            </Badge>
          )}
          {email && (
            <Badge variant="outline" className="text-xs gap-1.5 px-2 py-1">
              <Mail className="w-3 h-3" />
              {email.length > 20 ? email.slice(0, 20) + '...' : email}
            </Badge>
          )}
        </div>

        {/* Business Info */}
        <div className="flex flex-wrap gap-2">
          {nicho && (
            <Badge variant="secondary" className="text-xs gap-1.5 px-2 py-1">
              <Building2 className="w-3 h-3" />
              {nicho}
            </Badge>
          )}
          {faturamento && (
            <Badge variant="secondary" className="text-xs gap-1.5 px-2 py-1">
              <DollarSign className="w-3 h-3" />
              R$ {faturamento}
            </Badge>
          )}
        </div>

        {/* Principal Pain Point */}
        {principal_dor && (
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5">
            <div className="flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
              <span className="line-clamp-2">{principal_dor}</span>
            </div>
          </div>
        )}

        {/* Meeting Date */}
        {meeting_date && (
          <div className="flex items-center gap-1.5 text-sm text-primary font-medium bg-primary/10 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4" />
            Reunião: {format(new Date(meeting_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </div>
        )}

        {/* Notes Preview */}
        {notes && (
          <div className="text-xs text-muted-foreground italic line-clamp-1 border-t border-border/30 pt-2">
            📝 {notes}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/30 flex items-center justify-between">
          <span>Criado em {format(new Date(created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
