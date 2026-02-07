"use client";

import {
  useState,
  useEffect,
  KeyboardEvent,
  useCallback,
  useRef,
  ChangeEvent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "./AdminLayout";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Mic,
  Plus,
  X,
  Loader2,
  Save,
  Eye,
  Send,
  Upload,
  Volume2,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/app/components/ui/separator";
import { useBlog } from "@/app/context/BlogContext";

import { useDebouncedCallback } from "use-debounce";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Loader from "../../Loader";
import { Badge } from "@/app/components/ui/badge";
import BlogRichTextEditor from "../RichTextEditor";
import { useUserContextData } from "@/app/context/userData";

const MySwal = withReactContent(Swal);

// SweetAlert2 theme
const swalTheme = {
  background: "#ffffff",
  color: "#374151",
  confirmButtonColor: "#3b82f6",
  cancelButtonColor: "#6b7280",
  denyButtonColor: "#ef4444",
  iconColor: {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    question: "#6b7280",
  },
};

interface PostEditorProps {
  postId?: string;
  isDraft?: boolean;
}

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "1", name: "Technology" },
  { id: "2", name: "Business" },
  { id: "3", name: "Health" },
  { id: "4", name: "Lifestyle" },
  { id: "5", name: "Education" },
  { id: "6", name: "Finance" },
  { id: "7", name: "Productivity" },
  { id: "8", name: "Self-Improvement" },
];

// API utility functions
const api = {
  get: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch: ${response.statusText}`);
    }
    return response.json();
  },

  post: async (url: string, data: any, apiKey: string) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to create: ${response.statusText}`,
      );
    }
    return response.json();
  },

  put: async (url: string, data: any, apiKey: string) => {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to update: ${response.statusText}`,
      );
    }
    return response.json();
  },

  patch: async (url: string, data: any, apiKey: string) => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to update: ${response.statusText}`,
      );
    }
    return response.json();
  },

  delete: async (url: string, apiKey: string) => {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "x-api-key": apiKey,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to delete: ${response.statusText}`,
      );
    }
    return response.json();
  },
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Validation functions
const validatePost = (
  title: string,
  content: string,
  authorName: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!title.trim()) {
    errors.push("Title is required");
  } else if (title.trim().length < 5) {
    errors.push("Title must be at least 5 characters long");
  } else if (title.trim().length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (!content.trim() || content === "<p><br></p>") {
    errors.push("Content is required");
  } else if (content.replace(/<[^>]*>/g, "").trim().length < 100) {
    errors.push("Content must be at least 100 characters long");
  }

  if (!authorName.trim()) {
    errors.push("Author name is required");
  } else if (authorName.trim().length < 2) {
    errors.push("Author name must be at least 2 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUrl = (
  url: string,
  fieldName: string,
): { isValid: boolean; error?: string } => {
  if (!url.trim()) return { isValid: true };

  // Allow blob URLs and data URLs (for local file previews)
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return { isValid: true };
  }

  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: `${fieldName} must use HTTP or HTTPS protocol`,
      };
    }
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid URL`,
    };
  }
};

// Custom hook for alert functions
const useAlerts = () => {
  const showErrorAlert = useCallback((title: string, text: string) => {
    MySwal.fire({
      title,
      text,
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: swalTheme.confirmButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.error,
    });
  }, []);

  const showSuccessAlert = useCallback((title: string, text: string) => {
    MySwal.fire({
      title,
      text,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: swalTheme.confirmButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.success,
    });
  }, []);

  const showInfoAlert = useCallback((title: string, text: string) => {
    MySwal.fire({
      title,
      text,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: swalTheme.confirmButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.info,
    });
  }, []);

  const showWarningAlert = useCallback((title: string, text: string) => {
    MySwal.fire({
      title,
      text,
      icon: "warning",
      confirmButtonText: "OK",
      confirmButtonColor: swalTheme.confirmButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.warning,
    });
  }, []);

  const showConfirmDialog = useCallback(
    async (
      title: string,
      text: string,
      confirmButtonText = "Yes, proceed",
    ): Promise<boolean> => {
      const result = await MySwal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: swalTheme.cancelButtonColor,
        background: swalTheme.background,
        color: swalTheme.color,
        iconColor: swalTheme.iconColor.warning,
      });

      return result.isConfirmed;
    },
    [],
  );

  return {
    showErrorAlert,
    showSuccessAlert,
    showInfoAlert,
    showWarningAlert,
    showConfirmDialog,
  };
};

// Helper function to calculate read time
const calculateReadTime = (content: string): number => {
  if (!content) return 3;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

const PostEditor = ({ postId, isDraft = false }: PostEditorProps) => {
  const router = useRouter();
  const { userData } = useUserContextData();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [audioFile, setAudioFile] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("");
  const [authorBio, setAuthorBio] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [audioBase64, setAudioBase64] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewModalRef = useRef<HTMLDivElement>(null);

  // Use memoized alert functions
  const {
    showErrorAlert,
    showSuccessAlert,
    showInfoAlert,
    showWarningAlert,
    showConfirmDialog,
  } = useAlerts();

  // Categories memoized
  const categories = useMemo(() => DEFAULT_CATEGORIES, []);

  // Get API key from localStorage - memoized
  const getApiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("admin_api_key") ||
        process.env.NEXT_PUBLIC_ADMIN_API_KEY ||
        ""
      );
    }
    return process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";
  }, []);

  // Set author data from user context on component mount
  useEffect(() => {
    if (userData) {
      // Set author name from user data
      const name = userData.fullName || userData.username || "Author";
      setAuthorName(name);
      
      // Set author avatar from profilePicture
      if (userData.profilePicture) {
        setAuthorAvatar(userData.profilePicture);
      }
      
      // Set author bio if available
      if (userData.bio) {
        setAuthorBio(userData.bio);
      }
    }
  }, [userData]);

  // Auto-save to localStorage for new posts - memoized
  const saveToLocalDraft = useDebouncedCallback(() => {
    if (!postId && autoSaveEnabled && (title || content)) {
      const draft = {
        title,
        content,
        excerpt,
        categories: selectedCategories,
        featuredImage,
        audioFile,
        tags,
        authorName,
        authorAvatar,
        authorBio,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem("post_draft", JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, 3000);

  // Load post data if editing
  useEffect(() => {
    if (postId) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
          const post = await api.get(`/api/blog/posts?id=${postId}`);
          setTitle(post.title);
          setContent(post.content || "");
          setExcerpt(post.excerpt || "");
          setSelectedCategories(post.categories || []);
          setFeaturedImage(post.featured_image || "");
          setAudioFile(post.audio_file || "");
          setIsPublished(post.is_published);
          setTags(post.tags?.join(", ") || "");
          
          // Set author data from API response
          setAuthorName(post.author?.name || post.author_name || "Author");
          setAuthorAvatar(post.author?.avatar || "");
          setAuthorBio(post.author?.bio || "");
          
          setHasUnsavedChanges(false);
          setValidationErrors({});
        } catch (error) {
          console.error("Error fetching post:", error);
          showErrorAlert(
            "Failed to load post",
            error instanceof Error ? error.message : "Unknown error",
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchPost();
    } else {
      // For new posts, check if we should load from draft
      const loadFromLocalDraft = () => {
        if (typeof window !== "undefined") {
          const draft = localStorage.getItem("post_draft");
          if (draft) {
            try {
              const parsed = JSON.parse(draft);
              setTitle(parsed.title || "");
              setContent(parsed.content || "");
              setExcerpt(parsed.excerpt || "");
              setSelectedCategories(parsed.categories || []);
              setFeaturedImage(parsed.featuredImage || "");
              setAudioFile(parsed.audioFile || "");
              setTags(parsed.tags || "");
              setAuthorName(parsed.authorName || 
                (userData?.fullName || userData?.username || "Author"));
              setAuthorAvatar(parsed.authorAvatar || userData?.profilePicture || "");
              setAuthorBio(parsed.authorBio || userData?.bio || "");
              showInfoAlert(
                "Draft Loaded",
                "Loaded unsaved draft from local storage",
              );
            } catch (e) {
              console.error("Error loading draft from localStorage:", e);
            }
          } else if (userData) {
            // If no draft, set author data from user context
            setAuthorName(userData.fullName || userData.username || "Author");
            setAuthorAvatar(userData.profilePicture || "");
            setAuthorBio(userData.bio || "");
          }
        }
      };

      loadFromLocalDraft();
    }
  }, [postId, showErrorAlert, showInfoAlert, userData]);

  // Validate form before saving - memoized
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    const basicValidation = validatePost(title, content, authorName);
    if (!basicValidation.isValid) {
      basicValidation.errors.forEach((error) => {
        if (error.includes("Title")) errors.title = error;
        else if (error.includes("Content")) errors.content = error;
        else if (error.includes("Author")) errors.authorName = error;
      });
    }

    if (featuredImage.trim()) {
      const featuredImageValidation = validateUrl(
        featuredImage,
        "Featured image",
      );
      if (!featuredImageValidation.isValid && featuredImageValidation.error) {
        errors.featuredImage = featuredImageValidation.error;
      }
    }

    if (audioFile.trim()) {
      const audioFileValidation = validateUrl(audioFile, "Audio file");
      if (!audioFileValidation.isValid && audioFileValidation.error) {
        errors.audioFile = audioFileValidation.error;
      }
    }

    if (selectedCategories.length === 0) {
      errors.categories = "At least one category is required";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showErrorAlert(
        "Validation Error",
        "Please fix the following errors:\n\n" +
          Object.values(errors).join("\n"),
      );
      return false;
    }

    return true;
  }, [
    title,
    content,
    authorName,
    featuredImage,
    audioFile,
    selectedCategories,
    showErrorAlert,
  ]);

  // Handle featured image upload - memoized
  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      if (!validImageTypes.includes(file.type)) {
        showErrorAlert(
          "Invalid File Type",
          "Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)",
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorAlert("File Too Large", "Image file must be less than 5MB");
        return;
      }

      try {
        setUploadingImage(true);

        // Create a preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setFeaturedImage(previewUrl);

        // Convert to base64 for saving
        const base64 = await fileToBase64(file);
        setImageBase64(base64);

        // Clear any validation errors
        setValidationErrors((prev) => ({ ...prev, featuredImage: "" }));

        showInfoAlert(
          "Image Uploaded",
          "Image preview is ready. Note: Large images may affect performance.",
        );

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        showErrorAlert(
          "Upload Failed",
          error instanceof Error ? error.message : "Failed to process image",
        );
      } finally {
        setUploadingImage(false);
      }
    },
    [showErrorAlert, showInfoAlert],
  );

  // Handle audio file upload - memoized
  const handleAudioUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp4",
        "audio/x-m4a",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(file.type)) {
        showErrorAlert(
          "Invalid File Type",
          "Please upload a valid audio file (MP3, WAV, M4A, or OGG)",
        );
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showErrorAlert("File Too Large", "Audio file must be less than 50MB");
        return;
      }

      try {
        setUploadingAudio(true);

        // Create a preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setAudioFile(previewUrl);

        // Convert to base64 for saving
        const base64 = await fileToBase64(file);
        setAudioBase64(base64);

        // Clear any validation errors
        setValidationErrors((prev) => ({ ...prev, audioFile: "" }));

        showInfoAlert(
          "Audio Uploaded",
          "Audio file is ready. Note: Large audio files may affect performance.",
        );

        // Reset file input
        if (audioInputRef.current) {
          audioInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
        showErrorAlert(
          "Upload Failed",
          error instanceof Error ? error.message : "Failed to process audio file",
        );
      } finally {
        setUploadingAudio(false);
      }
    },
    [showErrorAlert, showInfoAlert],
  );

  // Handle drag and drop for featured image - memoized
  const handleImageDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      // Validate file type
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      if (!validImageTypes.includes(file.type)) {
        showErrorAlert(
          "Invalid File Type",
          "Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)",
        );
        return;
      }

      // Trigger file input click
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;

        // Create a change event to trigger the upload
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    },
    [showErrorAlert],
  );

  // Handle drag and drop for audio - memoized
  const handleAudioDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      // Validate file type
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp4",
        "audio/x-m4a",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(file.type)) {
        showErrorAlert(
          "Invalid File Type",
          "Please upload a valid audio file (MP3, WAV, M4A, or OGG)",
        );
        return;
      }

      // Trigger file input click
      if (audioInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        audioInputRef.current.files = dataTransfer.files;

        // Create a change event to trigger the upload
        const event = new Event("change", { bubbles: true });
        audioInputRef.current.dispatchEvent(event);
      }
    },
    [showErrorAlert],
  );

  // Handle drag over events - memoized
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-accent", "bg-[#C29307]/10");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-accent", "bg-[#C29307]/10");
  }, []);

  // Save draft to server - memoized
  const saveDraft = useCallback(
    async (silent = false): Promise<string | null> => {
      if (!validateForm()) {
        return null;
      }

      // Use base64 data if available, otherwise use the URL
      const finalFeaturedImage = imageBase64 || featuredImage;
      const finalAudioFile = audioBase64 || audioFile;

      const draftData = {
        title: title.trim() || "Untitled Draft",
        content: content.trim(),
        excerpt: excerpt.trim() || "",
        categories: selectedCategories,
        featuredImage: finalFeaturedImage.trim() || "",
        audioFile: finalAudioFile.trim() || "",
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        authorId: userData?.id || "default-author-id",
        authorName: authorName.trim(),
        authorAvatar: authorAvatar.trim() || "",
        authorBio: authorBio.trim() || "",
        isPublished: false
      };

      try {
        setIsSaving(true);
        const apiKey = getApiKey();

        let result;
        if (postId) {
          result = await api.put(
            `/api/blog/posts?id=${postId}`,
            draftData,
            apiKey,
          );
          if (!silent) {
            showSuccessAlert(
              "Post Updated",
              "Your post has been successfully updated!",
            );
          }
        } else {
          result = await api.post("/api/blog/posts", draftData, apiKey);
          if (!silent) {
            showSuccessAlert(
              "Post Saved",
              "Your post has been successfully saved!",
            );
          }
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem("post_draft");
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setValidationErrors({});

        if (!postId && result.id) {
          router.replace(`/blog/admin/posts/${result.id}/edit`);
          return result.id;
        }

        return postId || result.id;
      } catch (error) {
        console.error("Error saving post:", error);
        if (!silent) {
          showErrorAlert(
            "Save Failed",
            error instanceof Error ? error.message : "Error saving post",
          );
        }
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [
      validateForm,
      imageBase64,
      featuredImage,
      audioBase64,
      audioFile,
      title,
      content,
      excerpt,
      selectedCategories,
      tags,
      userData,
      authorName,
      authorAvatar,
      authorBio,
      getApiKey,
      postId,
      showSuccessAlert,
      showErrorAlert,
      router,
    ],
  );

  // Publish post - memoized
  const publishPost = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const confirmed = await showConfirmDialog(
      "Publish Post",
      "Are you sure you want to publish this post? It will be visible to all visitors.",
      "Yes, publish it!",
    );

    if (!confirmed) return;

    // Use base64 data if available, otherwise use the URL
    const finalFeaturedImage = imageBase64 || featuredImage;
    const finalAudioFile = audioBase64 || audioFile;

    const publishData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || "",
      categories: selectedCategories,
      featuredImage: finalFeaturedImage.trim() || "",
      audioFile: finalAudioFile.trim() || "",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      authorId: userData?.id || "default-author-id",
      authorName: authorName.trim(),
      authorAvatar: authorAvatar.trim() || "",
      authorBio: authorBio.trim() || "",
      isPublished: true
    };

    try {
      setIsLoading(true);
      const apiKey = getApiKey();

      let result;
      if (postId) {
        result = await api.put(`/api/blog/posts?id=${postId}`, publishData, apiKey);
        showSuccessAlert(
          "Post Published",
          "Your post has been successfully published!",
        );
      } else {
        result = await api.post("/api/blog/posts", publishData, apiKey);
        showSuccessAlert(
          "Post Created",
          "Your post has been created and published!",
        );
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("post_draft");
      }

      router.push("/blog/admin/post");
      router.refresh();
    } catch (error) {
      console.error("Error publishing post:", error);
      showErrorAlert(
        "Publish Failed",
        error instanceof Error ? error.message : "Error publishing post",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    validateForm,
    showConfirmDialog,
    imageBase64,
    featuredImage,
    audioBase64,
    audioFile,
    title,
    content,
    excerpt,
    selectedCategories,
    tags,
    userData,
    authorName,
    authorAvatar,
    authorBio,
    getApiKey,
    postId,
    showSuccessAlert,
    showErrorAlert,
    router,
  ]);

  const handleSave = useCallback(
    async (publish: boolean) => {
      if (publish) {
        await publishPost();
      } else {
        await saveDraft();
      }
    },
    [publishPost, saveDraft],
  );

  const handleDelete = useCallback(async () => {
    if (!postId) {
      if (typeof window !== "undefined") {
        const confirmed = await showConfirmDialog(
          "Clear Draft",
          "Are you sure you want to clear this unsaved draft? This action cannot be undone.",
          "Yes, clear it",
        );

        if (confirmed) {
          localStorage.removeItem("post_draft");
          showInfoAlert("Draft Cleared", "Local draft has been cleared");
          router.push("/blog/admin/post");
        }
      }
      return;
    }

    const confirmed = await showConfirmDialog(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      "Yes, delete it!",
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      const apiKey = getApiKey();
      await api.delete(`/api/blog/posts?id=${postId}`, apiKey);

      showSuccessAlert(
        "Post Deleted",
        "The post has been successfully deleted!",
      );
      router.push("/blog/admin/post");
      router.refresh();
    } catch (error) {
      console.error("Error deleting post:", error);
      showErrorAlert(
        "Delete Failed",
        error instanceof Error ? error.message : "Error deleting post",
      );
    } finally {
      setIsLoading(false);
    }
  }, [postId, showConfirmDialog, showInfoAlert, showSuccessAlert, showErrorAlert, getApiKey, router]);

  const addCategory = useCallback(() => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) {
      showErrorAlert("Invalid Category", "Category name cannot be empty");
      return;
    }

    if (trimmedCategory.length > 50) {
      showErrorAlert(
        "Invalid Category",
        "Category name cannot exceed 50 characters",
      );
      return;
    }

    if (selectedCategories.includes(trimmedCategory)) {
      showWarningAlert("Duplicate Category", "This category already exists");
      return;
    }

    setSelectedCategories([...selectedCategories, trimmedCategory]);
    setNewCategory("");
    showSuccessAlert("Category Added", `Added category: ${trimmedCategory}`);
    setValidationErrors((prev) => ({ ...prev, categories: "" }));
  }, [newCategory, selectedCategories, showErrorAlert, showWarningAlert, showSuccessAlert]);

  const removeCategory = useCallback(
    async (category: string) => {
      const confirmed = await MySwal.fire({
        title: "Remove Category",
        text: `Are you sure you want to remove "${category}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: swalTheme.cancelButtonColor,
        background: swalTheme.background,
        color: swalTheme.color,
        iconColor: swalTheme.iconColor.question,
      });

      if (confirmed.isConfirmed) {
        setSelectedCategories(selectedCategories.filter((c) => c !== category));
        showInfoAlert("Category Removed", `Removed category: ${category}`);
      }
    },
    [selectedCategories, showInfoAlert],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCategory();
      }
    },
    [addCategory],
  );

  const handlePreview = useCallback(() => {
    // Check if we have required content for preview
    if (!title.trim()) {
      showErrorAlert("Preview Error", "Please add a title to preview the post");
      return;
    }

    if (!content.trim() || content === "<p><br></p>") {
      showErrorAlert("Preview Error", "Please add content to preview the post");
      return;
    }

    if (selectedCategories.length === 0) {
      showErrorAlert("Preview Error", "Please add at least one category");
      return;
    }

    setShowPreview(true);
  }, [title, content, selectedCategories, showErrorAlert]);

  const handleClearFeaturedImage = useCallback(async () => {
    const confirmed = await MySwal.fire({
      title: "Remove Featured Image",
      text: "Are you sure you want to remove the featured image?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: swalTheme.cancelButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.question,
    });

    if (confirmed.isConfirmed) {
      // Revoke object URL if it's a blob URL
      if (featuredImage.startsWith("blob:")) {
        URL.revokeObjectURL(featuredImage);
      }
      setFeaturedImage("");
      setImageBase64("");
      showInfoAlert("Image Removed", "Featured image has been removed");
    }
  }, [featuredImage, showInfoAlert]);

  const handleClearAudioFile = useCallback(async () => {
    const confirmed = await MySwal.fire({
      title: "Remove Audio File",
      text: "Are you sure you want to remove the audio file?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: swalTheme.cancelButtonColor,
      background: swalTheme.background,
      color: swalTheme.color,
      iconColor: swalTheme.iconColor.question,
    });

    if (confirmed.isConfirmed) {
      // Revoke object URL if it's a blob URL
      if (audioFile.startsWith("blob:")) {
        URL.revokeObjectURL(audioFile);
      }
      setAudioFile("");
      setAudioBase64("");
      showInfoAlert("Audio Removed", "Audio file has been removed");
    }
  }, [audioFile, showInfoAlert]);

  const clearLocalDraft = useCallback(async () => {
    const confirmed = await showConfirmDialog(
      "Clear Draft",
      "Are you sure you want to clear this unsaved draft? All unsaved changes will be lost.",
      "Yes, clear it",
    );

    if (confirmed) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("post_draft");
        setLastSaved(null);
        setHasUnsavedChanges(false);
        showSuccessAlert("Draft Cleared", "Local draft has been cleared");
      }
    }
  }, [showConfirmDialog, showSuccessAlert]);

useEffect(() => {
  const handleKeyDown = (e: globalThis.KeyboardEvent) => {
    if (showPreview) {
      if (e.key === 'Escape') {
        setShowPreview(false);
        setIsFullscreen(false);
      }
      if (e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown as EventListener);
  return () => window.removeEventListener('keydown', handleKeyDown as EventListener);
}, [showPreview, isFullscreen]);

  // Prevent body scroll when preview is open
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreview]);

  // Auto-save effect
  useEffect(() => {
    if (!postId && autoSaveEnabled && (title || content)) {
      saveToLocalDraft();
      setHasUnsavedChanges(true);
    }
  }, [
    title,
    content,
    excerpt,
    selectedCategories,
    featuredImage,
    audioFile,
    tags,
    authorName,
    authorAvatar,
    authorBio,
    postId,
    autoSaveEnabled,
    saveToLocalDraft,
  ]);

  // Handle unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !postId) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, postId]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (featuredImage.startsWith("blob:")) {
        URL.revokeObjectURL(featuredImage);
      }
      if (audioFile.startsWith("blob:")) {
        URL.revokeObjectURL(audioFile);
      }
    };
  }, [featuredImage, audioFile]);

  // Calculate read time
  const readTime = calculateReadTime(content);

  if (isLoading && postId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <Loader />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {postId ? "Edit Post" : "Create New Post"}
            </h1>
            <p className="text-muted-foreground">
              {postId
                ? "Edit your published article"
                : "Write and publish your article"}
            </p>

            {/* Auto-save status */}
            {!postId && autoSaveEnabled && hasUnsavedChanges && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground">
                  Auto-saving...{" "}
                  {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
                </span>
              </div>
            )}
            
            {/* Author info */}
            {authorAvatar && (
              <div className="flex items-center gap-2 mt-2">
                <img 
                  src={authorAvatar} 
                  alt={authorName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-muted-foreground">
                  Author: {authorName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!postId && hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={clearLocalDraft}
                disabled={isLoading}
                size="sm"
              >
                Clear Draft
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isLoading || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              className="bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90"
              onClick={() => handleSave(true)}
              disabled={isLoading || isSaving}
            >
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Editor */}
          <div className="space-y-6">
            {/* Title */}
            <Input
              placeholder="Enter your title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
              className={`font-semibold focus-visible:ring-0 focus-visible:border-accent ${
                validationErrors.title ? "border-red-500" : "border-border"
              }`}
              disabled={isLoading}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-600 -mt-4">
                {validationErrors.title}
              </p>
            )}

            {/* Author Name */}
            <div className="space-y-2">
              <Label
                htmlFor="authorName"
                className={validationErrors.authorName ? "text-red-600" : ""}
              >
                Author Name
              </Label>
              <Input
                id="authorName"
                placeholder="Enter author name..."
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  if (validationErrors.authorName) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      authorName: "",
                    }));
                  }
                }}
                disabled={isLoading}
                className={
                  validationErrors.authorName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {validationErrors.authorName && (
                <p className="text-sm text-red-600">
                  {validationErrors.authorName}
                </p>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label className={validationErrors.content ? "text-red-600" : ""}>
                Content
              </Label>
              {validationErrors.content && (
                <p className="text-sm text-red-600 mb-2">
                  {validationErrors.content}
                </p>
              )}
              <div className="w-full min-h-[400px]">
                <BlogRichTextEditor
                  value={content}
                  onChange={(value) => {
                    setContent(value);
                    if (validationErrors.content) {
                      setValidationErrors((prev) => ({ ...prev, content: "" }));
                    }
                  }}
                  placeholder="Start writing your story..."
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <textarea
                placeholder="Write a brief summary of your article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                disabled={isLoading}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                A short summary that appears on blog listings and search results
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Auto-save Settings */}
            {!postId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Auto-save</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="auto-save-toggle"
                      className="cursor-pointer"
                    >
                      Enable auto-save
                    </Label>
                    <Switch
                      id="auto-save-toggle"
                      checked={autoSaveEnabled}
                      onCheckedChange={setAutoSaveEnabled}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {autoSaveEnabled
                      ? "Changes are automatically saved to your browser"
                      : "Auto-save is disabled. Remember to save manually."}
                  </p>
                  {lastSaved && (
                    <p className="text-xs text-muted-foreground">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Publish Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="publish-toggle" className="cursor-pointer">
                    Publish immediately
                  </Label>
                  <Switch
                    id="publish-toggle"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                    disabled={isLoading || !!postId}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {postId
                    ? isPublished
                      ? "This post is already published"
                      : "This post is currently a draft"
                    : isPublished
                    ? "Post will be published immediately when saved"
                    : "Post will be saved as a draft"}
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label
                    className={
                      validationErrors.categories ? "text-red-600" : ""
                    }
                  >
                    Select Categories
                  </Label>
                  {validationErrors.categories && (
                    <p className="text-sm text-red-600">
                      {validationErrors.categories}
                    </p>
                  )}
                  <Select
                    onValueChange={(value: string) => {
                      if (!selectedCategories.includes(value)) {
                        setSelectedCategories([...selectedCategories, value]);
                        if (validationErrors.categories) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            categories: "",
                          }));
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No categories found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addCategory}
                    disabled={isLoading || !newCategory.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 text-xs bg-secondary rounded-full flex items-center gap-1"
                      >
                        {cat}
                        <button
                          onClick={() => removeCategory(cat)}
                          className="hover:text-destructive transition-colors"
                          disabled={isLoading}
                          aria-label={`Remove ${cat} category`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter tags separated by commas..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {featuredImage ? (
                  <div className="relative">
                    <img
                      src={featuredImage}
                      alt="Featured preview"
                      className="w-full aspect-video object-cover rounded"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' text-anchor='middle' fill='%239ca3af'%3EImage not found%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleClearFeaturedImage}
                      disabled={isLoading || uploadingImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleImageDrop}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Processing...
                        </p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 1200×630px • Max: 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="featured-image-url"
                    className={
                      validationErrors.featuredImage ? "text-red-600" : ""
                    }
                  >
                    Or enter image URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="featured-image-url"
                      placeholder="Paste image URL..."
                      value={featuredImage}
                      onChange={(e) => {
                        setFeaturedImage(e.target.value);
                        if (validationErrors.featuredImage) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            featuredImage: "",
                          }));
                        }
                      }}
                      disabled={isLoading || uploadingImage}
                      className={
                        validationErrors.featuredImage
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {validationErrors.featuredImage && (
                    <p className="text-sm text-red-600">
                      {validationErrors.featuredImage}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uploaded images will be saved as base64 data in the database
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Audio File */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Audio File (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload an audio file if this is a podcast episode
                </p>

                {audioFile ? (
                  <div className="relative border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-8 h-8 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Audio file attached
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {audioFile.startsWith("blob:")
                            ? "Local audio file"
                            : audioFile}
                        </p>
                        <audio
                          src={audioFile}
                          controls
                          className="w-full mt-2"
                          onError={(e) => {
                            console.error("Audio playback error:", e);
                          }}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAudioFile}
                        disabled={isLoading || uploadingAudio}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer"
                    onClick={() => audioInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleAudioDrop}
                  >
                    {uploadingAudio ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Processing...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Mic className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP3, WAV, or M4A • Max: 50MB
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden audio file input */}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                  disabled={uploadingAudio}
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="audio-file-url"
                    className={validationErrors.audioFile ? "text-red-600" : ""}
                  >
                    Or enter audio file URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="audio-file-url"
                      placeholder="Paste audio file URL..."
                      value={audioFile}
                      onChange={(e) => {
                        setAudioFile(e.target.value);
                        if (validationErrors.audioFile) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            audioFile: "",
                          }));
                        }
                      }}
                      disabled={isLoading || uploadingAudio}
                      className={
                        validationErrors.audioFile
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={uploadingAudio}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {validationErrors.audioFile && (
                    <p className="text-sm text-red-600">
                      {validationErrors.audioFile}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uploaded audio will be saved as base64 data in the database
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      isPublished || (!postId && isPublished)
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {postId
                      ? isPublished
                        ? "Published"
                        : "Draft"
                      : isPublished
                      ? "Will be published"
                      : "Draft"}
                  </span>
                </div>
                {postId && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Post ID:{" "}
                      <span className="font-mono text-xs">{postId}</span>
                    </p>
                  </div>
                )}
                {!postId && hasUnsavedChanges && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-yellow-700">
                      ⚠️ You have unsaved changes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            ref={previewModalRef}
            className={`
              relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
              flex flex-col overflow-hidden transition-all duration-300
              ${isFullscreen ? 'fixed inset-0 m-0 rounded-none h-screen w-screen' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Post Preview
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Previewing: {title || "Untitled"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="gap-2"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
                
                {postId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/blog/preview/${postId}`, "_blank")}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
              <article className="max-w-4xl mx-auto">
                {/* Categories */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {selectedCategories.map((category, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-[#C29307]/10 text-[#C29307] hover:bg-[#C29307]/20 uppercase text-xs tracking-wider px-2 py-1"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-6 text-gray-900 dark:text-white">
                  {title || "Untitled Post"}
                </h1>

                {/* Excerpt */}
                {excerpt && (
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 italic border-l-4 border-[#C29307] pl-4 py-2">
                    {excerpt}
                  </p>
                )}

                {/* Author and Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {authorAvatar ? (
                        <img 
                          src={authorAvatar} 
                          alt={authorName}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#C29307]/20 to-[#C29307]/40 flex items-center justify-center">
                          <User className="w-6 h-6 text-[#C29307]" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#C29307] rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {authorName || "Author"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Featured Image */}
                {featuredImage && (
                  <div className="aspect-video overflow-hidden rounded-xl mb-8 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <img
                      src={featuredImage}
                      alt={title || "Featured image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' text-anchor='middle' fill='%239ca3af'%3EImage not found%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}

                {/* Audio Player */}
                {audioFile && (
                  <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <Volume2 className="w-6 h-6 text-[#C29307]" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Audio Preview
                      </span>
                    </div>
                    <audio
                      src={audioFile}
                      controls
                      className="w-full"
                      onError={(e) => {
                        console.error("Audio playback error:", e);
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none mb-8"
                  dangerouslySetInnerHTML={{ 
                    __html: content || '<p class="text-gray-500 italic">No content yet. Start writing above!</p>' 
                  }}
                />

                {/* Tags */}
                {tags.trim() && (
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Post Status:
                      </span>
                      <span className={`ml-2 px-3 py-1 text-sm rounded-full ${
                        isPublished 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last saved: {lastSaved ? lastSaved.toLocaleTimeString() : "Not saved yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This is a preview. Changes are not saved until you publish.
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close Preview
                  </Button>
                  <Button
                    className="bg-[#C29307] text-white hover:bg-[#C29307]/90"
                    onClick={() => {
                      setShowPreview(false);
                      handleSave(false);
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PostEditor;