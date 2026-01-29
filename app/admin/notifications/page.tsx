"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import RichTextEditor from "@/app/components/admin-components/RichTextEditor";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const parseMarkdown = (text: string) => {
  if (!text) return "";

  // If text contains HTML, return it as-is (with added classes)
  if (text.includes("<") && text.includes(">")) {
    return text
      .replace(/<h1>/g, '<h1 class="text-2xl font-bold mt-4 mb-2">')
      .replace(/<\/h1>/g, "</h1>")
      .replace(/<h2>/g, '<h2 class="text-xl font-bold mt-3 mb-2">')
      .replace(/<\/h2>/g, "</h2>")
      .replace(/<h3>/g, '<h3 class="text-lg font-bold mt-3 mb-1">')
      .replace(/<\/h3>/g, "</h3>")
      .replace(/<p>/g, '<p class="my-2">')
      .replace(/<\/p>/g, "</p>")
      .replace(
        /<a /g,
        '<a class="text-blue-500 underline hover:text-blue-700" target="_blank" '
      )
      .replace(
        /<img /g,
        '<img class="my-4 w-64 rounded-lg shadow-md border border-gray-200" '
      );
  }

  // Fallback to markdown parsing for legacy content
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
    .replace(
      /\[([^\[]+)\]\(([^\)]+)\)/gim,
      '<a href="$2" class="text-blue-500 underline hover:text-blue-700" target="_blank">$1</a>'
    )
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/gim,
      '<img src="$2" alt="$1" class="my-4 max-w-full h-auto rounded-lg shadow-md border border-gray-200" />'
    );
};

export default function NotificationsCenterPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    channels: ["in_app"],
    target_audience: "all_users",
    scheduled_for: "",
    is_urgent: false,
    specific_users: [] as string[],
  });
  const [userSearch, setUserSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingNotificationImages, setPendingNotificationImages] = useState<
    Array<{ file: File; placeholderId: string }>
  >([]);
  const itemsPerPage = 15;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch users for suggestions
  const { data: usersData, isLoading: isUsersLoading } = useSWR(
    userSearch
      ? `/api/admin-apis/notifications/users/search?search=${encodeURIComponent(
          userSearch
        )}&limit=100`
      : null,
    fetcher
  );

  useEffect(() => {
    if (usersData?.users) {
      setUserSuggestions(usersData.users);
      setIsSearchingUsers(false);
    }
  }, [usersData]);

  // Handle user search input with debounce
  useEffect(() => {
    if (userSearch) {
      setIsSearchingUsers(true);
    } else {
      setUserSuggestions([]);
      setIsSearchingUsers(false);
    }
  }, [userSearch]);

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
    });

    if (searchTerm) params.append("search", searchTerm);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (channelFilter !== "all") params.append("channel", channelFilter);

    return `/api/admin-apis/notifications?${params.toString()}`;
  }, [
    currentPage,
    dateRange,
    searchTerm,
    typeFilter,
    statusFilter,
    channelFilter,
    itemsPerPage,
  ]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Separate hook for stats
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: "10000",
    });

    if (searchTerm) params.append("search", searchTerm);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (channelFilter !== "all") params.append("channel", channelFilter);

    return `/api/admin-apis/notifications?${params.toString()}`;
  }, [dateRange, searchTerm, typeFilter, statusFilter, channelFilter]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, channelFilter, dateRange]);

  // Reset user selection when target audience changes
  useEffect(() => {
    if (newNotification.target_audience !== "specific_users") {
      setSelectedUsers([]);
      setNewNotification((prev) => ({
        ...prev,
        specific_users: [],
      }));
    }
  }, [newNotification.target_audience]);

  // Memoize calculations
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const totalNotifications = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(
    () => Math.ceil(totalNotifications / itemsPerPage),
    [totalNotifications, itemsPerPage]
  );

  // Use statsData for calculations
  const allFilteredNotifications = useMemo(
    () => statsData?.notifications || [],
    [statsData]
  );

  // Calculate stats
  const sentNotifications = useMemo(
    () => allFilteredNotifications.filter((n: any) => n.status === "sent"),
    [allFilteredNotifications]
  );

  const scheduledNotifications = useMemo(
    () => allFilteredNotifications.filter((n: any) => n.status === "scheduled"),
    [allFilteredNotifications]
  );

  const failedNotifications = useMemo(
    () => allFilteredNotifications.filter((n: any) => n.status === "failed"),
    [allFilteredNotifications]
  );

  const pushNotifications = useMemo(
    () =>
      allFilteredNotifications.filter((n: any) => n.channels?.includes("push")),
    [allFilteredNotifications]
  );

  const emailNotifications = useMemo(
    () =>
      allFilteredNotifications.filter((n: any) =>
        n.channels?.includes("email")
      ),
    [allFilteredNotifications]
  );

  // User selection handlers
  const handleAddUser = (user: any) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      const updatedUsers = [...selectedUsers, user];
      setSelectedUsers(updatedUsers);
      setNewNotification((prev) => ({
        ...prev,
        specific_users: updatedUsers.map((u) => u.id),
      }));
    }
    setUserSearch("");
    setUserSuggestions([]);
  };

  const handleRemoveUser = (userId: string) => {
    const updatedUsers = selectedUsers.filter((user) => user.id !== userId);
    setSelectedUsers(updatedUsers);
    setNewNotification((prev) => ({
      ...prev,
      specific_users: updatedUsers.map((u) => u.id),
    }));
  };

  // Function to upload a single image - WITH DEBUGGING
  const uploadImage = async (file: File): Promise<string> => {
    console.log("📤 Starting image upload for file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const formData = new FormData();
    formData.append("image", file);

    try {
      console.log("📤 Calling upload API...");
      const response = await fetch(
        "/api/admin-apis/notifications/upload/notification-image",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("📤 API Response status:", response.status);

      const result = await response.json();
      console.log("📤 API Response:", result);

      if (response.ok) {
        const imageUrl = result.url || result.data?.url || result.files?.[0];
        if (imageUrl) {
          console.log("✅ Image uploaded successfully:", imageUrl);
          return imageUrl;
        } else {
          console.error("❌ No URL in response:", result);
          throw new Error("No image URL returned from server");
        }
      } else {
        console.error("❌ Upload failed:", result);
        throw new Error(
          result.error || result.message || "Image upload failed"
        );
      }
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  };

  // Create new notification with proper image replacement
  const handleCreateNotification = async () => {
    console.log("=== START: handleCreateNotification ===");

    try {
      setIsSubmitting(true);

      // Validate specific users selection
      if (
        newNotification.target_audience === "specific_users" &&
        selectedUsers.length === 0
      ) {
        Swal.fire(
          "Error",
          "Please select at least one user for specific user notification",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      console.log("🔍 Checking message for images...");
      console.log("Original message length:", newNotification.message.length);

      // Debug: Check what's in the message
      const placeholderMatches = [
        ...newNotification.message.matchAll(/data-placeholder-id="([^"]+)"/g),
      ];
      const base64Matches = [
        ...newNotification.message.matchAll(
          /src="(data:image\/[^;]+;base64,[^"]+)"/g
        ),
      ];

      console.log(
        `Found ${placeholderMatches.length} placeholders, ${base64Matches.length} base64 images`
      );

      if (placeholderMatches.length > 0) {
        console.log(
          "Placeholder IDs:",
          placeholderMatches.map((m) => m[1])
        );
      }

      let finalMessage = newNotification.message;

      // Upload images first if there are any
      if (pendingNotificationImages.length > 0) {
        console.log(
          `📤 Uploading ${pendingNotificationImages.length} images...`
        );

        // Show progress dialog
        Swal.fire({
          title: "Uploading Images...",
          html: `Uploading 0 of ${pendingNotificationImages.length} images...`,
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const uploadResults = [];

          // Upload images sequentially
          for (let i = 0; i < pendingNotificationImages.length; i++) {
            const { file, placeholderId } = pendingNotificationImages[i];

            console.log(
              `📤 [${i + 1}/${pendingNotificationImages.length}] Uploading:`,
              {
                name: file.name,
                size: file.size,
                type: file.type,
                placeholderId,
              }
            );

            // Update progress
            Swal.update({
              html: `Uploading ${i + 1} of ${
                pendingNotificationImages.length
              } images...`,
            });

            try {
              const imageUrl = await uploadImage(file);
              console.log(
                `✅ Upload successful for ${placeholderId}:`,
                imageUrl
              );
              uploadResults.push({ placeholderId, imageUrl });
            } catch (uploadError: any) {
              console.error(
                `❌ Upload failed for ${placeholderId}:`,
                uploadError
              );
              throw new Error(
                `Failed to upload image "${file.name}": ${uploadError.message}`
              );
            }
          }

          console.log("🔄 Starting image replacement...");
          console.log("Upload results:", uploadResults);

          // METHOD 1: Replace by placeholder ID
          let replacementCount = 0;
          uploadResults.forEach(({ placeholderId, imageUrl }) => {
            console.log(`Looking for placeholder: ${placeholderId}`);

            // Create regex to find the exact img tag with this placeholder
            const imgRegex = new RegExp(
              `(<img[^>]*data-placeholder-id="${placeholderId}"[^>]*>)`,
              "gi"
            );
            const match = finalMessage.match(imgRegex);

            if (match && match[0]) {
              console.log(
                `Found img tag for ${placeholderId}:`,
                match[0].substring(0, 100)
              );

              // Get the current src (should be base64)
              const srcMatch = match[0].match(/src="([^"]*)"/);
              const currentSrc = srcMatch ? srcMatch[1] : "";

              if (currentSrc && currentSrc.startsWith("data:image")) {
                console.log(`Replacing base64 with URL for ${placeholderId}`);

                // Replace the src attribute
                const newImgTag = match[0]
                  .replace(/src="[^"]*"/, `src="${imageUrl}"`)
                  .replace(/data-placeholder-id="[^"]*"/, "")
                  .replace(
                    /style="[^"]*"/,
                    'style="max-width:100%;height:auto;border-radius:0.375rem;margin:0.5rem 0;"'
                  );

                finalMessage = finalMessage.replace(match[0], newImgTag);
                replacementCount++;
                console.log(`✅ Replaced ${placeholderId}`);
              } else {
                console.warn(`No base64 src found for ${placeholderId}`);
              }
            } else {
              console.warn(
                `❌ Could not find img tag with placeholder ${placeholderId}`
              );

              // Fallback: look for any base64 image
              const base64Regex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
              const base64Match = finalMessage.match(base64Regex);

              if (base64Match && base64Match.length > 0) {
                console.log(
                  "Found base64 images, attempting fallback replacement..."
                );
                // Replace the first base64 found
                finalMessage = finalMessage.replace(
                  base64Match[0],
                  `src="${imageUrl}"`
                );
                replacementCount++;
              }
            }
          });

          console.log(`Replaced ${replacementCount} images`);

          // METHOD 2: Clean up any remaining base64 images
          const remainingBase64 = [
            ...finalMessage.matchAll(/src="(data:image\/[^;]+;base64,[^"]+)"/g),
          ];
          if (remainingBase64.length > 0) {
            console.warn(
              `⚠️ ${remainingBase64.length} base64 images still remain!`
            );
            console.log("Attempting final cleanup...");

            // Replace each remaining base64 with a placeholder message
            remainingBase64.forEach((match, index) => {
              const placeholderMsg = `[Image ${index + 1} - Failed to upload]`;
              finalMessage = finalMessage.replace(match[0], placeholderMsg);
            });
          }

          // Final check
          const finalBase64Check = [
            ...finalMessage.matchAll(/data:image\/[^;]+;base64,[^"]+/g),
          ];
          const finalPlaceholderCheck = [
            ...finalMessage.matchAll(/data-placeholder-id="[^"]+"/g),
          ];

          console.log(
            `Final check: ${finalBase64Check.length} base64, ${finalPlaceholderCheck.length} placeholders`
          );

          Swal.close();

          if (finalBase64Check.length > 0) {
            Swal.fire({
              icon: "warning",
              title: "Image Upload Warning",
              html: `
                <div class="text-left">
                  <p class="mb-2"><strong>${finalBase64Check.length} image(s) may not display in emails.</strong></p>
                  <p class="text-sm text-gray-600">The notification will still be sent, but email recipients may see placeholders instead of images.</p>
                  <p class="text-xs text-gray-500 mt-2">You can continue or cancel to fix the issue.</p>
                </div>
              `,
              showCancelButton: true,
              confirmButtonText: "Send Anyway",
              cancelButtonText: "Cancel",
            }).then((result) => {
              if (!result.isConfirmed) {
                setIsSubmitting(false);
                return;
              }
              // Continue with submission
            });
          }
        } catch (uploadError: any) {
          console.error("❌ Image upload process failed:", uploadError);
          Swal.close();
          Swal.fire(
            "Error",
            `Failed to upload images: ${uploadError.message}`,
            "error"
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log("ℹ️ No pending images to upload");
      }

      // Final verification before sending
      console.log(
        "📝 Final message preview:",
        finalMessage.substring(0, 500) +
          (finalMessage.length > 500 ? "..." : "")
      );

      // Count actual image URLs in final message
      const imageUrlCount = (
        finalMessage.match(/src="https?:\/\/[^"]+"/g) || []
      ).length;
      console.log(
        `Found ${imageUrlCount} uploaded image URLs in final message`
      );

      // Create the notification with final message
      console.log("🚀 Sending notification to API...");

      const response = await fetch("/api/admin-apis/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newNotification,
          message: finalMessage,
        }),
        credentials: "include",
      });

      console.log("📨 API Response status:", response.status);

      const result = await response.json();
      console.log("📨 API Response:", result);

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Notification Created!",
          text: "Your notification has been scheduled successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        // Reset everything
        setShowCreateModal(false);
        setNewNotification({
          title: "",
          message: "",
          type: "info",
          channels: ["in_app"],
          target_audience: "all_users",
          scheduled_for: "",
          is_urgent: false,
          specific_users: [],
        });
        setSelectedUsers([]);
        setUserSearch("");
        setUserSuggestions([]);
        setShowPreview(false);
        setPendingNotificationImages([]);
        mutate();
      } else {
        console.error("❌ API Error details:", result);
        throw new Error(
          result.error || result.message || "Failed to create notification"
        );
      }

      console.log("=== END: handleCreateNotification - SUCCESS ===");
    } catch (err: any) {
      console.error("❌ Error in handleCreateNotification:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: `
          <div class="text-left">
            <p class="font-semibold mb-2">${err.message}</p>
            <p class="text-sm text-gray-600">Check the browser console for more details.</p>
          </div>
        `,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send notification immediately
  const handleSendNow = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/admin-apis/notifications/${notificationId}/send`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Notification Sent!",
          text: "The notification has been sent immediately",
          timer: 2000,
          showConfirmButton: false,
        });

        mutate();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to send notification", "error");
    }
  };

  // Cancel scheduled notification
  const handleCancel = async (notificationId: string) => {
    const result = await Swal.fire({
      title: "Cancel Notification?",
      text: "This will cancel the scheduled notification",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Cancel Notification",
      cancelButtonText: "Keep Scheduled",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `/api/admin-apis/notifications?id=${notificationId}`,
          {
            method: "DELETE",
          }
        );

        const deleteResult = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Cancelled!",
            text: "The notification has been cancelled",
            timer: 2000,
            showConfirmButton: false,
          });

          mutate();
        } else {
          throw new Error(deleteResult.error);
        }
      } catch (err: any) {
        Swal.fire(
          "Error",
          err.message || "Failed to cancel notification",
          "error"
        );
      }
    }
  };

  // Custom renderers
  const renderTypeBadge = (type: string) => {
    const typeConfig: any = {
      info: { color: "bg-blue-100 text-blue-800", text: "ℹ️ Info" },
      success: { color: "bg-green-100 text-green-800", text: "✅ Success" },
      warning: { color: "bg-yellow-100 text-yellow-800", text: "⚠️ Warning" },
      error: { color: "bg-red-100 text-red-800", text: "❌ Error" },
      contract: { color: "bg-purple-100 text-purple-800", text: "📝 Contract" },
      wallet: { color: "bg-orange-100 text-orange-800", text: "💰 Wallet" },
      transaction: {
        color: "bg-indigo-100 text-indigo-800",
        text: "💸 Transaction",
      },
    };

    const config = typeConfig[type] || {
      color: "bg-gray-100 text-gray-800",
      text: type,
    };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { color: "bg-gray-100 text-gray-800", text: "📝 Draft" },
      scheduled: {
        color: "bg-yellow-100 text-yellow-800",
        text: "⏰ Scheduled",
      },
      sent: { color: "bg-green-100 text-green-800", text: "✅ Sent" },
      failed: { color: "bg-red-100 text-red-800", text: "❌ Failed" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const renderChannels = (channels: string[]) => {
    const channelIcons: any = {
      in_app: "📱",
      email: "📧",
    };

    return (
      <div className="flex space-x-1">
        {channels?.map((channel) => (
          <Badge key={channel} variant="outline" className="text-xs">
            {channelIcons[channel] || "📦"} {channel}
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 mt-10">
          Failed to load notifications.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🔔 Notifications Center</h2>
            <p className="text-gray-600">
              Manage platform alerts and communications
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button
              className="bg-[#C29307] text-white hover:bg-[#a87e06]"
              onClick={() => setShowCreateModal(true)}
            >
              📢 Create Notification
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Sent</h3>
            <p className="text-2xl font-semibold text-green-600">
              {sentNotifications.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Scheduled</h3>
            <p className="text-2xl font-semibold text-[#C29307]">
              {scheduledNotifications.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Failed</h3>
            <p className="text-2xl font-semibold text-red-600">
              {failedNotifications.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Push Notifications
            </h3>
            <p className="text-2xl font-semibold text-blue-600">
              {pushNotifications.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
            <p className="text-2xl font-semibold text-orange-600">
              {emailNotifications.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by title, message, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setChannelFilter("all");
                    setDateRange("total");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {notifications.length} of {totalNotifications}{" "}
                notifications
                {` - Page ${currentPage} of ${totalPages}`}
              </div>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications History</CardTitle>
            <CardDescription>
              All platform notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <div key={notification.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {renderTypeBadge(notification.type)}
                        {renderStatusBadge(notification.status)}
                        {notification.is_urgent && (
                          <Badge className="bg-red-100 text-red-800">
                            🚨 URGENT
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg">
                        {notification.title}
                      </h3>

                      {/* Enhanced preview with image support */}
                      <div
                        className="text-gray-600 mt-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdown(notification.message),
                        }}
                      />

                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>To: {notification.target_audience}</span>
                        {notification.target_audience === "specific_users" &&
                          notification.stats?.users_notified && (
                            <span>
                              Users: {notification.stats.users_notified.length}{" "}
                              selected
                            </span>
                          )}
                        <span>
                          Channels: {renderChannels(notification.channels)}
                        </span>
                        <span>
                          Created:{" "}
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.scheduled_for && (
                          <span>
                            Scheduled:{" "}
                            {new Date(
                              notification.scheduled_for
                            ).toLocaleString()}
                          </span>
                        )}
                        {notification.sent_at && (
                          <span>
                            Sent:{" "}
                            {new Date(notification.sent_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Delivery Stats */}
                      {notification.stats && (
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span>
                            📱 In-App: {notification.stats.in_app_sent || 0}
                          </span>
                          <span>
                            📧 Email: {notification.stats.email_sent || 0}
                          </span>
                          <span>
                            ✅ Successful: {notification.stats.successful || 0}
                          </span>
                          <span>
                            ❌ Failed: {notification.stats.failed || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {notification.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSendNow(notification.id)}
                          >
                            Send Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(notification.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {notification.status === "draft" && (
                        <Button size="sm">Edit</Button>
                      )}
                      {notification.status === "failed" && (
                        <Button
                          size="sm"
                          onClick={() => handleSendNow(notification.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-lg font-semibold">
                    No notifications found
                  </h3>
                  <p className="text-gray-600">
                    Create your first notification to get started
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(totalPages, 7) }).map(
                      (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        className={
                          currentPage >= totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => setShowCreateModal(false)}
              />

              {/* Modal */}
              <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <Card className="max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>Create New Notification</CardTitle>
                    <CardDescription>
                      Send alerts to users via multiple channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Title *
                      </label>
                      <Input
                        placeholder="Notification title"
                        value={newNotification.title}
                        onChange={(e) =>
                          setNewNotification({
                            ...newNotification,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">
                          Message *
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          {showPreview ? "✏️ Edit" : "👁️ Preview"}
                        </Button>
                      </div>

                      {/* Message Input / Preview */}
                      {showPreview ? (
                        <div className="border rounded-md p-4 bg-gray-50 min-h-[300px]">
                          <h4 className="text-sm font-medium mb-4 text-gray-700">
                            Preview:
                          </h4>
                          {newNotification.message ? (
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(newNotification.message),
                              }}
                            />
                          ) : (
                            <p className="text-gray-500 italic">
                              No message to preview
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <RichTextEditor
                            value={newNotification.message}
                            onChange={(value) =>
                              setNewNotification({
                                ...newNotification,
                                message: value,
                              })
                            }
                            placeholder="Type your notification message here..."
                            height={300}
                            className="border-0"
                            onImagesAdded={(images) => {
                              console.log(
                                "Images added to editor:",
                                images.length
                              );
                              setPendingNotificationImages(images);
                            }}
                          />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Rich text editor with formatting, images, and links
                        support
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Type
                        </label>
                        <Select
                          value={newNotification.type}
                          onValueChange={(value) =>
                            setNewNotification({
                              ...newNotification,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="contract">
                              Contract Update
                            </SelectItem>
                            <SelectItem value="wallet">Wallet Alert</SelectItem>
                            <SelectItem value="transaction">
                              Transaction Alert
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Target Audience
                        </label>
                        <Select
                          value={newNotification.target_audience}
                          onValueChange={(value) =>
                            setNewNotification({
                              ...newNotification,
                              target_audience: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_users">All Users</SelectItem>
                            <SelectItem value="premium_users">
                              Premium Users
                            </SelectItem>
                            <SelectItem value="new_users">New Users</SelectItem>
                            <SelectItem value="inactive_users">
                              Inactive Users
                            </SelectItem>
                            <SelectItem value="specific_users">
                              Specific Users
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Specific Users Selection */}
                    {newNotification.target_audience === "specific_users" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Select Users *
                        </label>
                        <div className="space-y-3">
                          {/* User Search */}
                          <div className="relative">
                            <Input
                              placeholder="Search users by name or email..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                            />
                            {(isSearchingUsers || isUsersLoading) && (
                              <div className="absolute right-3 top-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                              </div>
                            )}

                            {userSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {userSuggestions.map((user) => (
                                  <div
                                    key={user.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                    onClick={() => handleAddUser(user)}
                                  >
                                    <div className="font-medium">
                                      {user.first_name} {user.last_name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {user.email}
                                    </div>
                                  </div>
                                ))}
                                {userSuggestions.length >= 100 && (
                                  <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50">
                                    Showing first 100 results. Refine your
                                    search for more specific results.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Selected Users */}
                          {selectedUsers.length > 0 && (
                            <div className="border rounded-md p-3 bg-gray-50">
                              <div className="text-sm font-medium mb-2">
                                Selected Users ({selectedUsers.length})
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 bg-white border rounded"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">
                                        {user.first_name} {user.last_name}
                                      </div>
                                      <div className="text-sm text-gray-600 truncate">
                                        {user.email}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveUser(user.id)}
                                      className="ml-2 shrink-0"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedUsers.length === 0 &&
                            userSearch &&
                            userSuggestions.length === 0 &&
                            !isSearchingUsers && (
                              <div className="text-center py-4 text-gray-500 border rounded-md">
                                No users found matching "{userSearch}"
                              </div>
                            )}

                          {selectedUsers.length === 0 && !userSearch && (
                            <div className="text-center py-4 text-gray-500 border rounded-md">
                              Search for users by name or email above
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Channels
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {["in_app", "email"].map((channel) => (
                          <div
                            key={channel}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={newNotification.channels.includes(
                                channel
                              )}
                              onChange={(e) => {
                                const updatedChannels = e.target.checked
                                  ? [...newNotification.channels, channel]
                                  : newNotification.channels.filter(
                                      (c) => c !== channel
                                    );
                                setNewNotification({
                                  ...newNotification,
                                  channels: updatedChannels,
                                });
                              }}
                              className="h-4 w-4 text-[#C29307] focus:ring-[#C29307] border-gray-300 rounded"
                            />
                            <span className="text-sm capitalize">
                              {channel === "in_app"
                                ? "📱 In-App"
                                : channel === "email"
                                ? "📧 Email"
                                : channel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Schedule For (Optional)
                        </label>
                        <Input
                          type="datetime-local"
                          value={newNotification.scheduled_for}
                          onChange={(e) =>
                            setNewNotification({
                              ...newNotification,
                              scheduled_for: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newNotification.is_urgent}
                          onCheckedChange={(checked) =>
                            setNewNotification({
                              ...newNotification,
                              is_urgent: checked,
                            })
                          }
                          className="data-[state=checked]:bg-[#C29307]"
                        />
                        <label className="text-sm font-medium">
                          Mark as Urgent
                        </label>
                      </div>
                    </div>

                    {/* Pending mn s Warning */}
                    {pendingNotificationImages.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <div className="shrink-0">
                            <svg
                              className="h-5 w-5 text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Note:</span>{" "}
                              {pendingNotificationImages.length} image
                              {pendingNotificationImages.length > 1
                                ? "s"
                                : ""}{" "}
                              will be uploaded when you submit this
                              notification.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedUsers([]);
                          setUserSearch("");
                          setUserSuggestions([]);
                          setShowPreview(false);
                          setPendingNotificationImages([]);
                          setNewNotification({
                            title: "",
                            message: "",
                            type: "info",
                            channels: ["in_app"],
                            target_audience: "all_users",
                            scheduled_for: "",
                            is_urgent: false,
                            specific_users: [],
                          });
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateNotification}
                        disabled={
                          !newNotification.title ||
                          !newNotification.message ||
                          (newNotification.target_audience ===
                            "specific_users" &&
                            selectedUsers.length === 0) ||
                          isSubmitting
                        }
                        className="bg-[#C29307] text-white hover:bg-[#a87e06]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          `Create Notification${
                            pendingNotificationImages.length > 0
                              ? ` (${pendingNotificationImages.length} image${
                                  pendingNotificationImages.length > 1
                                    ? "s"
                                    : ""
                                })`
                              : ""
                          }`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
