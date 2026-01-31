"use client";

import { useEffect, useState } from "react";
import { useUserContextData } from "../context/userData";
import { X } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read_at: string | null;
}

// Markdown parser for toast notifications
const parseMarkdown = (text: string) => {
  if (!text) return "";

  return (
    text
      // Headers
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-base font-bold mt-1 mb-0.5">$1</h1>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-sm font-bold mt-1 mb-0.5">$1</h2>'
      )
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-sm font-semibold mt-0.5 mb-0">$1</h3>'
      )
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/gim, '<s class="line-through">$1</s>')
      // Links
      .replace(
        /\[([^\[]+)\]\(([^\)]+)\)/gim,
        '<a href="$2" class="text-blue-400 underline hover:text-blue-600" target="_blank">$1</a>'
      )
      // Line breaks
      .replace(/\n/gim, "<br />")
      // Image placeholder
      .replace(
        /\[Image: (.*?)\]/gim,
        '<div class="bg-gray-100 border rounded p-1 my-1 text-xs text-gray-600">🖼️ Image: $1</div>'
      )
  );
};

const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "contract":
      return "📝";
    case "wallet":
      return "💰";
    case "transaction":
      return "💸";
    case "security":
      return "🔒";
    case "info":
      return "ℹ️";
    case "success":
      return "✅";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
    default:
      return "🔔";
  }
};

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "success":
      return "border-l-green-500";
    case "warning":
      return "border-l-yellow-500";
    case "error":
      return "border-l-red-500";
    case "info":
      return "border-l-blue-500";
    case "contract":
      return "border-l-purple-500";
    case "wallet":
      return "border-l-orange-500";
    case "transaction":
      return "border-l-indigo-500";
    case "security":
      return "border-l-gray-500";
    default:
      return "border-l-blue-500";
  }
};

export default function NotificationToast() {
  const { userData, notifications, markAsRead, fetchNotifications } =
    useUserContextData();
  const [toastNotifications, setToastNotifications] = useState<
    ToastNotification[]
  >([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Show only unread notifications that haven't been shown yet
  useEffect(() => {
    if (!userData || !notifications || notifications.length === 0) return;

    const newUnreadNotifications = notifications.filter(
      (notification: ToastNotification) =>
        !notification.read_at && !processedIds.has(notification.id)
    );

    if (newUnreadNotifications.length > 0) {
      setToastNotifications((prev) =>
        [...newUnreadNotifications, ...prev].slice(0, 5)
      ); // Keep only 5 most recent

      // Mark these as processed
      setProcessedIds((prev) => {
        const newSet = new Set(prev);
        newUnreadNotifications.forEach((n) => newSet.add(n.id));
        return newSet;
      });
    }
  }, [notifications, userData, processedIds]);

  const removeNotification = async (id: string) => {
    try {
      // Mark as read in backend and context
      await markAsRead(id);

      // Remove from toast
      setToastNotifications((prev) => prev.filter((n) => n.id !== id));
      
      // Remove from processed IDs
      setProcessedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error("Error removing notification:", error);
      // Still remove from UI even if backend fails
      setToastNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (toastNotifications.length === 0) return;

    const timer = setTimeout(() => {
      const oldestNotification =
        toastNotifications[toastNotifications.length - 1];
      if (oldestNotification) {
        removeNotification(oldestNotification.id);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [toastNotifications]);

  if (toastNotifications.length === 0 || !userData) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toastNotifications.map((notification) => (
        <Card
          key={notification.id}
          className={`shadow-lg border-l-4 animate-in slide-in-from-right duration-300 ${getTypeColor(
            notification.type
          )}`}
        >
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {notification.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
                <div
                  className="text-xs text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(notification.message),
                  }}
                />
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 ml-2 shrink-0 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}