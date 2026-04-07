import { cn } from '@/lib/cn';

export type PaginationBarProps = {
  page: number;
  lastPage: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
};

export const PaginationBar = ({
  page,
  lastPage,
  onPrev,
  onNext,
  disabled,
  className,
}: PaginationBarProps) => {
  const canGoPrev = page > 1;
  const canGoNext = lastPage > 0 && page < lastPage;

  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-sm', className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled || !canGoPrev}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-zinc-400">
        Página {page}
        {lastPage > 0 ? ` de ${lastPage}` : ''}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || !canGoNext}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
};
