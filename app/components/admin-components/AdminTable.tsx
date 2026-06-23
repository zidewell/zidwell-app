// app/components/admin-components/AdminTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

function formatValue(key: string, value: any) {
  if (!value) return "-";

  if (/(date|created_at|updated_at|timestamp|blocked_at|last_login|last_logout)/i.test(key)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch (error) {
      console.error("Date formatting error:", error);
    }
  }

  return String(value);
}

type Column = { 
  key: string; 
  label: string; 
  render?: (value: any, row: any) => React.ReactNode;
};

type CustomAction = {
  label: string;
  onClick: (row: any) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  icon?: string;
};

type AdminTableProps = {
  columns: Column[];
  rows: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onDownload?: (row: any) => void;
  onBlockToggle?: (row: any) => void;
  onForceLogout?: (row: any) => void;
  onViewLoginHistory?: (row: any) => void;
  onViewDetails?: (row: any) => void;
  onRetryTransaction?: (row: any) => void;
  onRowClick?: (row: any) => void;
  customActions?: CustomAction[];
  emptyMessage?: string;
  searchPlaceholder?: string;
};

export default function AdminTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onDownload,
  onBlockToggle,
  onForceLogout,
  onViewLoginHistory,
  onViewDetails,
  onRetryTransaction,
  onRowClick,
  customActions = [],
  emptyMessage = "No records found",
}: AdminTableProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderCellContent = (column: Column, row: any) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    if (isClient) {
      return formatValue(column.key, value);
    }
    return value || "-";
  };

  const hasActions = onEdit || onDelete || onDownload || onBlockToggle || 
                    onForceLogout || onViewLoginHistory || onViewDetails || 
                    onRetryTransaction || customActions.length > 0;

  return (
    <div className="overflow-x-auto border border-[var(--border-color)] squircle-lg shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            <TableHead className="w-10 text-center text-[var(--text-secondary)] font-medium">S/N</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key} className="text-[var(--text-secondary)] font-medium">
                {col.label}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="text-right text-[var(--text-secondary)] font-medium">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow 
                key={row.id || index}
                className={`border-b border-[var(--border-color)] ${
                  onRowClick ? "cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className="text-center text-[var(--text-secondary)]">{index + 1}</TableCell>

                {columns.map((col) => (
                  <TableCell key={col.key} className="text-[var(--text-primary)]">
                    {renderCellContent(col, row)}
                  </TableCell>
                ))}

                {hasActions && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[var(--bg-primary)] border-[var(--border-color)] shadow-pop squircle-md">
                        {customActions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={`${action.className || ""} hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-primary)]`}
                          >
                            {action.icon && <span className="mr-2">{action.icon}</span>}
                            {action.label}
                          </DropdownMenuItem>
                        ))}

                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(row)} className="hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-primary)]">
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onRetryTransaction && (
                          <DropdownMenuItem 
                            onClick={() => onRetryTransaction(row)}
                            className={row.status === "failed" ? "text-[var(--color-accent-yellow)]" : "text-[var(--text-secondary)] opacity-50"}
                            disabled={row.status !== "failed"}
                          >
                            Retry Transaction
                          </DropdownMenuItem>
                        )}
                        {onDownload && (
                          <DropdownMenuItem onClick={() => onDownload(row)} className="hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-primary)]">
                            Download Documents
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(row)} className="hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-primary)]">
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onBlockToggle && (
                          <DropdownMenuItem
                            onClick={() => onBlockToggle(row)}
                            className={`${
                              row.is_blocked || row.status === 'inactive'
                                ? "text-[var(--color-lemon-green)]"
                                : "text-[var(--destructive)]"
                            } hover:bg-[var(--bg-secondary)] cursor-pointer font-medium`}
                          >
                            {row.is_blocked || row.status === 'inactive' ? "🔄 Activate" : "⛔ Deactivate"}
                          </DropdownMenuItem>
                        )}
                        {onForceLogout && (
                          <DropdownMenuItem onClick={() => onForceLogout(row)} className="text-[var(--color-accent-yellow)] hover:bg-[var(--bg-secondary)] cursor-pointer">
                            🚪 Force Logout
                          </DropdownMenuItem>
                        )}
                        {onViewLoginHistory && (
                          <DropdownMenuItem onClick={() => onViewLoginHistory(row)} className="text-blue-600 hover:bg-[var(--bg-secondary)] cursor-pointer">
                            📊 View Login History
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(row)} className="text-[var(--destructive)] hover:bg-[var(--bg-secondary)] cursor-pointer">
                            🗑️ Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (hasActions ? 2 : 1)} 
                className="text-center text-[var(--text-secondary)] py-8"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}