import type { MatchStatus } from '@/features/matches/api';
import { cn } from '@/lib/cn';

const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: 'Programado',
  FINISHED: 'Finalizado',
  POSTPONED: 'Aplazado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<MatchStatus, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-800 ring-sky-200',
  FINISHED: 'bg-zinc-200 text-zinc-800 ring-zinc-300',
  POSTPONED: 'bg-amber-100 text-amber-800 ring-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200',
};

interface MatchStatusBadgeProps {
  status: MatchStatus;
}

export const MatchStatusBadge = ({ status }: MatchStatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
      STATUS_CLASS[status],
    )}
  >
    {STATUS_LABEL[status]}
  </span>
);
