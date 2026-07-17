"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  deleteAdminFile,
  getAdminFileAccessUrl,
  getAdminSavedFiles,
  saveAdminFiles,
  type AdminSavedFileItem,
  type ContentTypeGroup,
} from "@/app/_services/files.service";
import { canAccessFilesCredentialPermission } from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { useAuthStore } from "@/app/stores/authStore";
import { isUserIsAdminCheck } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import FileTypeIcon from "./FileTypeIcon";
import { UploadCloud, Sparkles, CloudRain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const decimals = i === 0 ? 0 : i === 1 ? 1 : 2;
  return `${v.toFixed(decimals)} ${units[i]}`;
}

function formatDate(ts: string | number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getExt(name: string) {
  const parts = name.split(".");
  if (parts.length < 2) return "—";
  return parts[parts.length - 1].toUpperCase();
}

function shortTypeFromMeta(fileName: string, contentType?: string) {
  const ext = getExt(fileName);
  if (ext !== "—") return ext;
  const t = contentType?.trim();
  return t ? t.split("/")[1]?.toUpperCase() || "FILE" : "FILE";
}

function fileTypeLabelFromMeta(fileName: string, contentType?: string) {
  const t = contentType?.trim();
  if (t) {
    if (t.startsWith("image/")) return "Image";
    if (t.startsWith("application/pdf")) return "PDF";
    if (t.startsWith("text/")) return "Text";
    return t.split("/")[1]?.toUpperCase()
      ? t.split("/")[1].toUpperCase()
      : "File";
  }

  const ext = getExt(fileName);
  if (ext === "PDF") return "PDF";
  if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(ext))
    return "Image";
  if (["DOC", "DOCX"].includes(ext)) return "Document";
  if (["XLS", "XLSX"].includes(ext)) return "Spreadsheet";
  if (["CSV"].includes(ext)) return "CSV";
  if (["TXT"].includes(ext)) return "Text";
  return "File";
}

type DeleteDialogState =
  | { mode: "single"; item: AdminSavedFileItem }
  | { mode: "bulk"; items: AdminSavedFileItem[] }
  | null;

const FilesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(user);
  const { credentials, loading: credentialsLoading } = useAdminCredentials(
    user?._id,
  );
  const hasFilesPermission = canAccessFilesCredentialPermission(
    isAdmin,
    credentials,
    user?.role,
  );
  const shouldCheckFilesPermission = user?.role === "admin";
  const isFilesPermissionResolved =
    !shouldCheckFilesPermission || !credentialsLoading;
  const canUseFilesApis = !shouldCheckFilesPermission || hasFilesPermission;
  const showFilesPermissionDenied =
    shouldCheckFilesPermission &&
    isFilesPermissionResolved &&
    !hasFilesPermission;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusIndex, setUploadStatusIndex] = useState(0);

  const statusMessages = [
    { title: "Uploading to S3...", desc: "Securing your documents in the cloud" },
    { title: "Analyzing document...", desc: "Parsing metadata and layouts" },
    { title: "Extracting content...", desc: "Reading text layout and structure" },
    { title: "Processing tables and images...", desc: "Structuring tabular information" },
    { title: "Generating embeddings...", desc: "Feeding AI vector indexing engines" },
    { title: "Preparing insights...", desc: "Connecting relationships and tags" },
    { title: "Almost done...", desc: "Finalizing synchronization check" }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setUploadStatusIndex(0);
      interval = setInterval(() => {
        setUploadStatusIndex((prev) => (prev + 1) % statusMessages.length);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading]);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [items, setItems] = useState<AdminSavedFileItem[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [contentTypeGroup, setContentTypeGroup] =
    useState<ContentTypeGroup>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const MAX_FILES = 10;
  const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

  const totalBytes = useMemo(
    () => items.reduce((acc, it) => acc + (it.size_bytes || 0), 0),
    [items],
  );
  const hasActiveFilters = useMemo(
    () => Boolean(search || contentTypeGroup || fromDate || toDate),
    [search, contentTypeGroup, fromDate, toDate],
  );

  const openPicker = () => {
    if (isUploading) return;
    setError(null);
    inputRef.current?.click();
  };

  const fetchFiles = useCallback(async () => {
    if (!canUseFilesApis) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPrevPage(false);
      setIsLoadingList(false);
      return;
    }

    setIsLoadingList(true);
    setError(null);

    try {
      const response = await getAdminSavedFiles({
        page,
        limit,
        search,
        contentTypeGroup,
        from: fromDate,
        to: toDate,
      });

      setItems(response.items || []);
      setTotal(response.pagination.total || 0);
      setTotalPages(response.pagination.totalPages || 1);
      setHasNextPage(Boolean(response.pagination.hasNextPage));
      setHasPrevPage(Boolean(response.pagination.hasPrevPage));
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to load files.";
      setError(message);
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPrevPage(false);
    } finally {
      setIsLoadingList(false);
    }
  }, [
    canUseFilesApis,
    contentTypeGroup,
    fromDate,
    limit,
    page,
    search,
    toDate,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!isFilesPermissionResolved) return;
    if (!canUseFilesApis) {
      setIsLoadingList(false);
      return;
    }
    fetchFiles();
  }, [canUseFilesApis, fetchFiles, isFilesPermissionResolved]);

  const addFiles = async (fileList: FileList | File[]) => {
    if (!canUseFilesApis) {
      setError("You don't have permission to access Files. Ask Super Admin.");
      return;
    }

    const nextFiles = Array.from(fileList);
    if (nextFiles.length === 0) return;

    setError(null);

    if (nextFiles.length > MAX_FILES) {
      setError(
        `Too many files selected. Maximum ${MAX_FILES} files are allowed per request.`,
      );
      return;
    }

    const nextBytes = nextFiles.reduce((acc, f) => acc + f.size, 0);
    if (nextBytes > MAX_TOTAL_BYTES) {
      setError(
        `Total selected size exceeded. Limit is ${formatBytes(MAX_TOTAL_BYTES)} per request.`,
      );
      return;
    }

    setIsUploading(true);
    try {
      await saveAdminFiles(nextFiles);

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchFiles();
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to upload one or more files.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    // Drag/drop can include multiple types; files are what we need.
    if (dt.files && dt.files.length > 0) {
      addFiles(dt.files);
    }
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = () => {
    setIsDragging(false);
  };

  const onBrowseChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (files) addFiles(files);
    // allow picking the same file again
    e.target.value = "";
  };

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [openFileLoadingId, setOpenFileLoadingId] = useState<string | null>(
    null,
  );
  const [deleteFileLoadingId, setDeleteFileLoadingId] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogState, setDeleteDialogState] =
    useState<DeleteDialogState>(null);

  const previewItem =
    previewIndex === null ? null : (items[previewIndex] ?? null);
  const selectedCount = selectedIds.size;
  const areAllVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const openSignedFile = useCallback(
    async (item: AdminSavedFileItem) => {
      if (!canUseFilesApis) {
        setError("You don't have permission to access Files. Ask Super Admin.");
        return;
      }

      setOpenFileLoadingId(item.id);
      try {
        const signedUrl = await getAdminFileAccessUrl(item.id);
        if (!signedUrl) {
          setError("Failed to generate file URL.");
          return;
        }
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to open file.");
      } finally {
        setOpenFileLoadingId(null);
      }
    },
    [canUseFilesApis],
  );

  const removeFile = useCallback(
    async (item: AdminSavedFileItem) => {
      if (!canUseFilesApis) {
        setError("You don't have permission to access Files. Ask Super Admin.");
        return;
      }

      setDeleteFileLoadingId(item.id);
      try {
        await deleteAdminFile(item.id);

        if (previewItem?.id === item.id) {
          setPreviewIndex(null);
          setPreviewUrl(null);
        }

        if (items.length === 1 && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        } else {
          await fetchFiles();
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to delete file.");
      } finally {
        setDeleteFileLoadingId(null);
      }
    },
    [canUseFilesApis, fetchFiles, items.length, page, previewItem?.id],
  );

  const requestRemoveFile = useCallback(
    (item: AdminSavedFileItem) => {
      if (!canUseFilesApis) {
        setError("You don't have permission to access Files. Ask Super Admin.");
        return;
      }
      setDeleteDialogState({ mode: "single", item });
    },
    [canUseFilesApis],
  );

  useEffect(() => {
    if (previewIndex === null) return;
    if (previewIndex >= items.length) {
      setPreviewIndex(null);
    }
  }, [items.length, previewIndex]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(items.map((i) => i.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [items]);

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        items.length > 0 && items.every((item) => next.has(item.id));
      if (allSelected) {
        items.forEach((item) => next.delete(item.id));
      } else {
        items.forEach((item) => next.add(item.id));
      }
      return next;
    });
  }, [items]);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const removeSelectedFiles = useCallback(async () => {
    if (!canUseFilesApis) {
      setError("You don't have permission to access Files. Ask Super Admin.");
      return;
    }

    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedItems.map((item) => deleteAdminFile(item.id)),
      );

      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        setError(
          `${failedCount} file${failedCount === 1 ? "" : "s"} could not be deleted.`,
        );
      }

      if (previewItem?.id && selectedIds.has(previewItem.id)) {
        setPreviewIndex(null);
        setPreviewUrl(null);
      }

      setSelectedIds(new Set());

      if (items.length === selectedItems.length && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await fetchFiles();
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to delete selected files.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  }, [canUseFilesApis, fetchFiles, items, page, previewItem?.id, selectedIds]);

  const requestRemoveSelectedFiles = useCallback(() => {
    if (!canUseFilesApis) {
      setError("You don't have permission to access Files. Ask Super Admin.");
      return;
    }

    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    setDeleteDialogState({ mode: "bulk", items: selectedItems });
  }, [canUseFilesApis, items, selectedIds]);

  const confirmDeleteFromDialog = useCallback(async () => {
    if (!deleteDialogState) return;

    if (deleteDialogState.mode === "single") {
      await removeFile(deleteDialogState.item);
      setDeleteDialogState(null);
      return;
    }

    await removeSelectedFiles();
    setDeleteDialogState(null);
  }, [deleteDialogState, removeFile, removeSelectedFiles]);

  useEffect(() => {
    const loadPreviewUrl = async () => {
      if (!previewItem?.id) {
        setPreviewUrl(null);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const signedUrl = await getAdminFileAccessUrl(previewItem.id);
        setPreviewUrl(signedUrl || null);
      } catch (e: any) {
        setPreviewUrl(null);
        setError(e?.response?.data?.message || "Failed to load preview URL.");
      } finally {
        setIsPreviewLoading(false);
      }
    };

    loadPreviewUrl();
  }, [previewItem?.id]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden flex-1">
      <div className="flex flex-1 flex-col h-full max-h-screen overflow-x-hidden overflow-y-auto py-4 md:py-6">
        <div className="px-4 md:px-6 max-w-4xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight">Files</h1>
                <p className="mt-1 text-base font-normal tracking-tight text-gray-600">
                  Upload and manage files in S3.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2"></div>
            </div>

            <div className="text-sm font-normal tracking-tight text-gray-500">
              Limits: up to {MAX_FILES} files per request,{" "}
              {formatBytes(MAX_TOTAL_BYTES)} total for all files.
            </div>

            <div className="text-xs font-normal tracking-tight text-gray-500">
              {isUploading
                ? "Uploading files to S3..."
                : isLoadingList
                  ? "Refreshing library..."
                  : `${total} total file${total === 1 ? "" : "s"} in library`}
            </div>

            {isUploading ? (
              <div className="inline-flex items-center gap-2 text-xs text-blue-700 font-medium">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
                Upload in progress
              </div>
            ) : null}

            {showFilesPermissionDenied ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold tracking-tight text-amber-900">
                  You do not have permission to access files.
                </div>
                <div className="mt-1 text-sm text-amber-800">
                  Ask Super Admin to enable files management credentials for
                  your account.
                </div>
              </div>
            ) : null}
          </div>

          {/* Preview Modal (Google preview-like with left/right) */}
          {!showFilesPermissionDenied && previewItem ? (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-[96vw] h-[92vh] max-w-none rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                      {previewItem.original_name || previewItem.file_name}
                    </div>
                    <div className="text-xs font-normal tracking-tight text-gray-500">
                      {shortTypeFromMeta(
                        previewItem.file_name,
                        previewItem.content_type,
                      )}{" "}
                      • {formatBytes(previewItem.size_bytes)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewIndex(null)}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="p-4 flex-1 min-h-0">
                  <div className="relative rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden h-full">
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (previewIndex === null) return;
                          setPreviewIndex(Math.max(0, previewIndex - 1));
                        }}
                        className="h-10 w-10 m-2 rounded-2xl bg-white/90 border border-gray-200 shadow-sm text-gray-700 hover:bg-white"
                        aria-label="Previous file"
                        disabled={previewIndex === null || previewIndex <= 0}
                      >
                        <span className="block text-lg leading-none">‹</span>
                      </button>
                    </div>

                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (previewIndex === null) return;
                          setPreviewIndex(
                            Math.min(items.length - 1, previewIndex + 1),
                          );
                        }}
                        className="h-10 w-10 m-2 rounded-2xl bg-white/90 border border-gray-200 shadow-sm text-gray-700 hover:bg-white"
                        aria-label="Next file"
                        disabled={
                          previewIndex === null ||
                          previewIndex >= items.length - 1
                        }
                      >
                        <span className="block text-lg leading-none">›</span>
                      </button>
                    </div>

                    <div className="h-full flex items-center justify-center p-8">
                      {/* Render preview only for images/PDF; otherwise show a simple message */}
                      {isPreviewLoading ? (
                        <div className="flex flex-col items-center gap-2 text-sm font-normal tracking-tight text-gray-600">
                          <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
                          Loading preview...
                        </div>
                      ) : !previewUrl ? (
                        <div className="text-sm font-normal tracking-tight text-gray-600">
                          Preview link is unavailable.
                        </div>
                      ) : previewItem.content_type?.startsWith("image/") ? (
                        <img
                          src={previewUrl}
                          alt={previewItem.original_name}
                          className="max-h-[78vh] w-auto object-contain"
                        />
                      ) : previewItem.content_type === "application/pdf" ||
                        getExt(previewItem.file_name) === "PDF" ? (
                        <iframe
                          src={previewUrl}
                          title={previewItem.original_name}
                          className="w-full h-full border-0 bg-white"
                        />
                      ) : (
                        <div className="text-center max-w-md">
                          <div className="text-sm font-semibold tracking-tight text-gray-900">
                            Preview not available
                          </div>
                          <div className="mt-1 text-sm font-normal tracking-tight text-gray-600">
                            This file type cannot be previewed inline.
                          </div>

                          <div className="mt-4 flex items-center justify-center gap-2">
                            <a
                              href={previewUrl}
                              download={
                                previewItem.original_name ||
                                previewItem.file_name
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold tracking-tight text-blue-700 hover:bg-blue-100"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3">
                  <div className="text-xs font-normal tracking-tight text-gray-500">
                    {items.length === 0 || previewIndex === null
                      ? ""
                      : `File ${previewIndex + 1} of ${items.length}`}
                  </div>
                  <div className="text-xs font-normal tracking-tight text-gray-500">
                    Use ← / → arrows (buttons) to navigate
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Dropzone */}
          {!showFilesPermissionDenied ? (
            <div className="mt-4">
              <input
                ref={inputRef}
                className="hidden"
                type="file"
                multiple
                onChange={onBrowseChange}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={openPicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPicker();
                }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={
                  "w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer outline-none overflow-hidden relative group " +
                  (isDragging
                    ? "border-blue-500 bg-blue-50/50 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50/50") +
                  (isUploading ? " opacity-70 pointer-events-none" : "")
                }
              >
                {/* Decorative Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="p-8 md:p-12 relative z-10 flex flex-col items-center justify-center text-center">
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
                          <div className="h-16 w-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center relative">
                            <span className="inline-block h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold tracking-tight text-blue-900 min-h-[28px] w-64 mx-auto text-center transition-all duration-300">
                            {statusMessages[uploadStatusIndex].title}
                          </div>
                          <div className="text-sm text-blue-600/80 mt-1 font-medium min-h-[20px] w-64 mx-auto text-center transition-all duration-300">
                            {statusMessages[uploadStatusIndex].desc}
                          </div>
                        </div>
                        <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden mt-1 relative">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration: 10,
                              ease: "easeInOut",
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <motion.div
                          animate={isDragging ? { y: -5, scale: 1.05 } : { y: 0, scale: 1 }}
                          className={
                            "relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 " +
                            (isDragging
                              ? "bg-blue-600 text-white shadow-blue-500/30"
                              : "bg-white border border-gray-100 text-blue-500 group-hover:border-blue-100 group-hover:shadow-blue-500/10")
                          }
                        >
                          <UploadCloud size={36} className={isDragging ? "animate-bounce" : "transition-transform group-hover:-translate-y-1"} />
                          {isDragging && (
                            <motion.div
                              layoutId="glow"
                              className="absolute inset-0 rounded-2xl bg-blue-500 blur-xl -z-10 opacity-40"
                            />
                          )}
                        </motion.div>

                        <div className="max-w-md">
                          <h3 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-950 transition-colors">
                            {isDragging ? "Drop to upload instantly" : "Click or drag files to upload"}
                          </h3>
                          <p className="mt-2 text-sm text-gray-500 font-medium">
                            Upload documents, images, or PDFs up to {formatBytes(MAX_TOTAL_BYTES)} total.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                            <Sparkles size={14} />
                            Auto-optimizes media
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                            <CloudRain size={14} />
                            S3 Secured
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 w-full max-w-md overflow-hidden rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium text-left flex items-start gap-3"
                    >
                      <div className="mt-0.5 rounded-full bg-red-100 p-1">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-red-800 font-semibold mb-0.5">Upload Failed</span>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* CONTENT */}
        {!showFilesPermissionDenied ? (
          <div className="px-4 md:px-6 max-w-4xl w-full mx-auto flex-1 min-h-0 flex flex-col">
            <div className="mt-8 pb-6 flex-1 min-h-0 flex flex-col">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight">Library</h2>
                  <div className="mt-1 text-sm font-normal tracking-tight text-gray-500">
                    {total === 0
                      ? "Your library is empty"
                      : `${total} file${total === 1 ? "" : "s"} found`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectMode}
                    className={
                      "rounded-lg border px-3 py-2 text-xs font-semibold tracking-tight inline-flex items-center gap-2 " +
                      (isSelectMode
                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50")
                    }
                  >
                    {isSelectMode ? "Cancel" : "Select"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterDialogOpen(true)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 5H21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6 12H18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 19H14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Filters
                  </button>
                </div>
              </div>

              {isSelectMode && items.length > 0 ? (
                <div className="mb-3 rounded-xl border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={areAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>Select all on this page</span>
                    {selectedCount > 0 ? (
                      <span className="text-gray-500">
                        ({selectedCount} selected)
                      </span>
                    ) : null}
                  </div>

                  {selectedCount > 0 ? (
                    <button
                      type="button"
                      onClick={requestRemoveSelectedFiles}
                      disabled={isBulkDeleting}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {isBulkDeleting
                        ? "Deleting selected..."
                        : `Delete selected (${selectedCount})`}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isFilterDialogOpen ? (
                <div
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold tracking-tight text-gray-900">
                        Filters
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterDialogOpen(false)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Search by file name or uploader"
                          className="md:col-span-2 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />

                        <select
                          value={contentTypeGroup}
                          onChange={(e) => {
                            setContentTypeGroup(
                              e.target.value as ContentTypeGroup,
                            );
                            setPage(1);
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">All types</option>
                          <option value="image">Images</option>
                          <option value="pdf">PDF</option>
                          <option value="text">Text</option>
                          <option value="other">Other</option>
                        </select>

                        <select
                          value={limit}
                          onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                        </select>

                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => {
                            setFromDate(e.target.value);
                            setPage(1);
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />

                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => {
                            setToDate(e.target.value);
                            setPage(1);
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          setSearch("");
                          setContentTypeGroup("");
                          setFromDate("");
                          setToDate("");
                          setPage(1);
                        }}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50"
                      >
                        Reset filters
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFilterDialogOpen(false)}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {isLoadingList ? (
                <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
                  <div className="text-sm font-normal tracking-tight text-gray-600">
                    Loading files...
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-bold">—</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-gray-900">
                        {hasActiveFilters
                          ? "Filtered items not found"
                          : "Your library is empty"}
                      </div>
                      <div className="mt-1 text-sm font-normal tracking-tight text-gray-600">
                        {hasActiveFilters
                          ? "Try changing or clearing your filters."
                          : "Add files using the dropzone above. They’ll appear here instantly."}
                      </div>

                      {!hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={openPicker}
                          className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50"
                        >
                          Add
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {items.map((it, idx) => {
                    return (
                      <div
                        key={it.id}
                        onClick={() => {
                          if (isSelectMode) {
                            toggleItemSelection(it.id);
                            return;
                          }
                          setPreviewIndex(idx);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            if (isSelectMode) {
                              toggleItemSelection(it.id);
                            } else {
                              setPreviewIndex(idx);
                            }
                          }
                        }}
                        className="group relative rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/40 p-5 flex items-start justify-between gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                      >
                        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl border flex items-center justify-center bg-white border-gray-200 shadow-sm">
                            <FileTypeIcon
                              fileName={
                                it.file_name || it.original_name || "file"
                              }
                              contentType={it.content_type}
                              className="text-gray-700"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold tracking-tight text-gray-900 truncate pr-2">
                              {it.original_name || it.file_name}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium tracking-tight">
                              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                                {shortTypeFromMeta(
                                  it.file_name,
                                  it.content_type,
                                )}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                                {formatBytes(it.size_bytes)}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                                {formatDate(it.createdAt)}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-gray-500 truncate">
                              <span className="font-medium text-gray-600">
                                {shortTypeFromMeta(
                                  it.file_name,
                                  it.content_type,
                                )}
                              </span>
                              {it.uploaded_by?.email
                                ? ` • ${it.uploaded_by.email}`
                                : ""}
                            </div>

                            {/* <div className="mt-3 h-1.5 w-48 max-w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                              style={{ width: `${Math.min(100, (it.size_bytes / MAX_TOTAL_BYTES) * 100)}%` }}
                            />
                          </div> */}
                          </div>
                        </div>

                        {isSelectMode && (
                          <div>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(it.id)}
                              onChange={() => toggleItemSelection(it.id)}
                              className="h-4 w-4 rounded border-gray-300 bg-white"
                              aria-label={`Select ${it.original_name || it.file_name}`}
                            />
                          </div>
                        )}

                        {!isSelectMode ? (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSignedFile(it);
                              }}
                              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold tracking-tight text-gray-800 hover:bg-gray-50 transition-colors min-w-[84px]"
                            >
                              {openFileLoadingId === it.id ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
                                  Opening...
                                </span>
                              ) : (
                                "Open"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestRemoveFile(it);
                              }}
                              disabled={deleteFileLoadingId === it.id}
                              className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold tracking-tight text-red-700 hover:bg-red-100/80 transition-colors disabled:opacity-60 min-w-[84px]"
                            >
                              {deleteFileLoadingId === it.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {!showFilesPermissionDenied ? (
        <div className="mt-auto mx-auto w-full max-w-4xl px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            Page {page} of {Math.max(1, totalPages)} • Showing {items.length} of{" "}
            {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={Boolean(deleteDialogState)}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogState(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogState?.mode === "bulk"
                ? `Delete ${deleteDialogState.items.length} selected file${deleteDialogState.items.length === 1 ? "" : "s"}?`
                : "Delete file?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogState?.mode === "bulk"
                ? "This will remove selected files from S3 and database."
                : `This will remove ${deleteDialogState?.item?.original_name || deleteDialogState?.item?.file_name || "this file"} from S3 and database.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(deleteFileLoadingId) || isBulkDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteFromDialog();
              }}
              disabled={Boolean(deleteFileLoadingId) || isBulkDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {Boolean(deleteFileLoadingId) || isBulkDeleting
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FilesPage;
