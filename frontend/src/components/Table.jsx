import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

export const Table = ({ columns, data, empty, rowKey, zebra = true }) => (
  <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200 text-left">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.length ? (
            data.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'transition hover:bg-brand-50/50',
                  zebra && rowIndex % 2 === 1 ? 'bg-neutral-50/60' : 'bg-white'
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 align-top text-sm text-neutral-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-12 text-center text-sm text-neutral-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export const TablePagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="mb-0 text-sm text-neutral-500">
        Page <span className="font-semibold text-neutral-900">{page}</span> of{' '}
        <span className="font-semibold text-neutral-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          iconRight={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
