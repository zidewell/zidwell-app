// app/components/admin-components/AdminTable.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

export interface AdminTableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface AdminTableCustomAction {
  label: string;
  onClick: (row: any) => void;
  className?: string;
  icon?: React.ReactNode;
}

interface AdminTableProps {
  columns: AdminTableColumn[];
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
  customActions?: AdminTableCustomAction[];
  emptyMessage?: string;
}

const DATE_LIKE_KEYS = [
  "created_at",
  "updated_at",
  "signed_at",
  "sent_at",
  "expires_at",
  "paid_at",
  "submitted_at",
  "approved_at",
  "rejected_at",
  "reviewed_at",
  "login_time",
  "logout_time",
  "blocked_at",
  "flagged_at",
  "frozen_at",
  "attempted_at",
  "last_used",
  "last_login",
  "last_logout",
  "issued_at",
];

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasActions =
    onEdit ||
    onDelete ||
    onDownload ||
    onBlockToggle ||
    onForceLogout ||
    onViewLoginHistory ||
    onViewDetails ||
    onRetryTransaction ||
    customActions.length > 0;

  const buildActions = (row: any) => {
    const actions: AdminTableCustomAction[] = [];
    if (onViewDetails)
      actions.push({
        label: "View Details",
        onClick: onViewDetails,
        icon: "👁",
      });
    if (onEdit) actions.push({ label: "Edit", onClick: onEdit, icon: "✎" });
    if (onViewLoginHistory)
      actions.push({
        label: "Login History",
        onClick: onViewLoginHistory,
        icon: "🕒",
      });
    if (onDownload)
      actions.push({ label: "Download", onClick: onDownload, icon: "⬇" });
    if (onRetryTransaction)
      actions.push({ label: "Retry", onClick: onRetryTransaction, icon: "↻" });
    if (onBlockToggle)
      actions.push({
        label: "Block / Unblock",
        onClick: onBlockToggle,
        icon: "🚫",
      });
    if (onForceLogout)
      actions.push({
        label: "Force Logout",
        onClick: onForceLogout,
        icon: "⇥",
      });
    actions.push(...customActions);
    if (onDelete)
      actions.push({
        label: "Delete",
        onClick: onDelete,
        className: "text-destructive",
        icon: "🗑",
      });
    return actions;
  };

  return (
    <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--border-color) bg-(--bg-secondary)/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-(--text-secondary) w-12">
                S/N
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-(--text-secondary) whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-(--text-secondary) w-16">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 2 : 1)}
                  className="px-4 py-12 text-center text-(--text-secondary)"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const rowId = row.id ?? row.ticket_id ?? idx;
                const actions = hasActions ? buildActions(row) : [];
                return (
                  <tr
                    key={rowId}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-(--border-color) last:border-0 transition-colors ${
                      onRowClick
                        ? "cursor-pointer hover:bg-(--bg-secondary)/40"
                        : "hover:bg-(--bg-secondary)/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-(--text-secondary)">
                      {idx + 1}
                    </td>
                    {columns.map((col) => {
                      const raw = row[col.key];
                      let content: React.ReactNode;
                      if (col.render) {
                        content = col.render(raw, row);
                      } else if (DATE_LIKE_KEYS.includes(col.key) && raw) {
                        content = formatDate(raw);
                      } else if (
                        raw === null ||
                        raw === undefined ||
                        raw === ""
                      ) {
                        content = (
                          <span className="text-(--text-secondary)">—</span>
                        );
                      } else {
                        content = String(raw);
                      }
                      return (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-(--text-primary) whitespace-nowrap"
                        >
                          {content}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td className="px-4 py-3 text-right">
                        <div
                          className="relative inline-block"
                          ref={openMenu === String(rowId) ? menuRef : undefined}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(
                                openMenu === String(rowId)
                                  ? null
                                  : String(rowId),
                              );
                            }}
                            className="squircle-sm px-2 py-1 text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
                            aria-label="Actions"
                          >
                            ⋯
                          </button>
                          {openMenu === String(rowId) && (
                            <div className="absolute right-0 mt-2 w-48 squircle-md border border-(--border-color) bg-(--bg-primary) shadow-pop z-20 py-1">
                              {actions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenu(null);
                                    action.onClick(row);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-(--bg-secondary) transition-colors flex items-center gap-2 ${
                                    action.className ?? "text-(--text-primary)"
                                  }`}
                                >
                                  {action.icon && (
                                    <span className="w-4 text-center">
                                      {action.icon}
                                    </span>
                                  )}
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
