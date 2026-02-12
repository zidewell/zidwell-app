"use client"
import { useState } from 'react';
import { X, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { useJournal } from '@/app/context/JournalContext';
import { useUserContextData } from '@/app/context/userData';

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
  journalType 
}: ExportStatementModalProps) {
  const { entries, categories, activeJournalType } = useJournal();
  const { userData } = useUserContextData();
  const [statementDateRange, setStatementDateRange] = useState<{
    from: string;
    to: string;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  if (!isOpen) return null;

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  const handleDownloadStatement = async () => {
    if (!statementDateRange.from || !statementDateRange.to) {
      alert("Please select a date range for the statement");
      return;
    }

    if (!userData?.id) {
      alert("User data not found");
      return;
    }

    // Validate date range
    const fromDate = new Date(statementDateRange.from);
    const toDate = new Date(statementDateRange.to);

    if (fromDate > toDate) {
      alert("From date cannot be later than To date");
      return;
    }

    setDownloadingStatement(true);

    try {
      // Use the onExport prop from parent
      await onExport(statementDateRange);
      
      // Close modal
      onClose();
    } catch (error: any) {
      console.error("Error downloading statement:", error);
      alert(
        `Error: ${
          error.message || "Failed to download statement. Please try again."
        }`
      );
    } finally {
      setDownloadingStatement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Download Journal Statement
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Select a date range to download your journal entries as a professional PDF statement.
              The statement will include ALL journal entries from the selected period.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={statementDateRange.from}
                    onChange={(e) =>
                      setStatementDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C29307] focus:border-transparent"
                    max={statementDateRange.to || getToday()}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={statementDateRange.to}
                    onChange={(e) =>
                      setStatementDateRange((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#C29307] focus:border-transparent"
                    min={statementDateRange.from}
                    max={getToday()}
                  />
                </div>
              </div>
            </div>

            {/* Quick Range Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setDate(fromDate.getDate() - 7);
                  const from = fromDate.toISOString().split("T")[0];
                  setStatementDateRange({ from, to });
                }}
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e'
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setDate(fromDate.getDate() - 30);
                  const from = fromDate.toISOString().split("T")[0];
                  setStatementDateRange({ from, to });
                }}
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e'
                }}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setMonth(fromDate.getMonth() - 3);
                  const from = fromDate.toISOString().split("T")[0];
                  setStatementDateRange({ from, to });
                }}
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e'
                }}
              >
                Last 3 months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setMonth(fromDate.getMonth() - 6);
                  const from = fromDate.toISOString().split("T")[0];
                  setStatementDateRange({ from, to });
                }}
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e'
                }}
              >
                Last 6 months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setMonth(fromDate.getMonth() - 12);
                  const from = fromDate.toISOString().split("T")[0];
                  setStatementDateRange({ from, to });
                }}
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e'
                }}
              >
                Last 12 months
              </Button>
            </div>

            {statementDateRange.from && statementDateRange.to && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm text-blue-800">
                  Selected range:{" "}
                  {formatDateDisplay(statementDateRange.from)} to{" "}
                  {formatDateDisplay(statementDateRange.to)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Journal Type: {journalType.charAt(0).toUpperCase() + journalType.slice(1)}
                </p>
              </div>
            )}

            <div className="pt-4 border-t" style={{ borderColor: '#e6dfd6' }}>
              <Button
                onClick={handleDownloadStatement}
                disabled={
                  !statementDateRange.from ||
                  !statementDateRange.to ||
                  downloadingStatement
                }
                className="w-full font-semibold hover:opacity-90 transition-opacity h-11"
                style={{
                  background: !statementDateRange.from || !statementDateRange.to || downloadingStatement
                    ? '#e6dfd6' 
                    : 'linear-gradient(135deg, #C29307 0%, #eab308 100%)',
                  color: !statementDateRange.from || !statementDateRange.to || downloadingStatement 
                    ? '#80746e' 
                    : '#26121c',
                  boxShadow: !statementDateRange.from || !statementDateRange.to || downloadingStatement
                    ? 'none' 
                    : '0 4px 20px -4px rgba(194, 147, 7, 0.3)'
                }}
              >
                {downloadingStatement ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Statement...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Statement as PDF
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This may take a moment for large date ranges
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}