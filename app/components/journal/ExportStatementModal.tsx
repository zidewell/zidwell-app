// app/components/journal/ExportStatementModal.tsx

import { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { format } from 'date-fns';

interface ExportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (dateRange: { from: string; to: string }) => Promise<void>;
  journalType: string;
}

export function ExportStatementModal({
  isOpen,
  onClose,
  onExport,
  journalType,
}: ExportStatementModalProps) {
  const [statementDateRange, setStatementDateRange] = useState<{
    from: string;
    to: string;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  if (!isOpen) return null;

  const getToday = () => new Date().toISOString().split('T')[0];

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleDownloadStatement = async () => {
    if (!statementDateRange.from || !statementDateRange.to) {
      alert('Please select a date range for the statement');
      return;
    }

    const fromDate = new Date(statementDateRange.from);
    const toDate = new Date(statementDateRange.to);

    if (fromDate > toDate) {
      alert('From date cannot be later than To date');
      return;
    }

    setDownloadingStatement(true);
    try {
      await onExport(statementDateRange);
      onClose();
    } catch (error: any) {
      console.error('Error downloading statement:', error);
      alert(error.message || 'Failed to download statement. Please try again.');
    } finally {
      setDownloadingStatement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-primary) border border-(--border-color) shadow-pop squircle-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3
              className="text-xl font-bold text-(--text-primary)"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Download Journal Statement
            </h3>
            <button
              onClick={onClose}
              className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-(--text-secondary) text-sm">
              Select a date range to download your journal entries as a professional PDF statement.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block text-(--text-secondary)">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
                  <input
                    type="date"
                    value={statementDateRange.from}
                    onChange={(e) =>
                      setStatementDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    className="w-full border border-(--border-color) rounded-md px-3 py-2 pl-10 bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                    max={statementDateRange.to || getToday()}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-(--text-secondary)">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
                  <input
                    type="date"
                    value={statementDateRange.to}
                    onChange={(e) =>
                      setStatementDateRange((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }))
                    }
                    className="w-full border border-(--border-color) rounded-md px-3 py-2 pl-10 bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                    min={statementDateRange.from}
                    max={getToday()}
                  />
                </div>
              </div>
            </div>

            {/* Quick Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 3 months', days: 90 },
                { label: 'Last 6 months', days: 180 },
                { label: 'Last 12 months', days: 365 },
              ].map(({ label, days }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const to = getToday();
                    const fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - days);
                    const from = fromDate.toISOString().split('T')[0];
                    setStatementDateRange({ from, to });
                  }}
                  className="border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
                >
                  {label}
                </Button>
              ))}
            </div>

            {statementDateRange.from && statementDateRange.to && (
              <div className="p-3 bg-(--bg-secondary) rounded-md border border-(--border-color)">
                <p className="text-sm text-(--text-primary)">
                  Selected range: {formatDateDisplay(statementDateRange.from)} to {formatDateDisplay(statementDateRange.to)}
                </p>
                <p className="text-xs text-(--text-secondary) mt-1">
                  Journal Type: {journalType.charAt(0).toUpperCase() + journalType.slice(1)}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-(--border-color)">
              <Button
                onClick={handleDownloadStatement}
                disabled={!statementDateRange.from || !statementDateRange.to || downloadingStatement}
                className="w-full font-semibold h-11 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
              >
                {downloadingStatement ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Statement...
                  </>
                ) : (
                  'Download Statement as PDF'
                )}
              </Button>
              <p className="text-xs text-(--text-secondary) mt-2 text-center">
                This may take a moment for large date ranges
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}