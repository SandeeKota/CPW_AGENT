"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Bot,
  RefreshCw,
  Trash2,
  Edit2,
  MessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  Clock,
  Loader2,
  Search,
  Sparkles,
  Database,
  Terminal,
  HelpCircle,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/app/stores/chatStore";
import ConfirmModal from "@/app/components/ConfirmModal";
import AgentTextArea from "./components/agentTextarea";
import MarkdownRenderer from "./components/MarkdownRenderer";
import Image from "next/image";
import agentIcon from "@/assets/agent_icon.png";
import agentWelcome from "@/assets/agent_welcome.gif";

const SUGGESTIONS = [
  {
    title: "Fundraising Targets",
    desc: "Check our donation progress and 2026 goals.",
    icon: Sparkles,
    prompt: "What is our fundraising target status for 2026 and how much have we raised so far?",
    color: "from-amber-500/10 to-orange-500/10 text-orange-600 border-orange-200/50 hover:border-orange-300",
  },
  {
    title: "Water Center Status",
    desc: "Get installation updates for purification centers.",
    icon: Database,
    prompt: "What is the current installation status of the Kothapally, Peddapalli, and Malkajgiri water centers?",
    color: "from-blue-500/10 to-indigo-500/10 text-indigo-600 border-indigo-200/50 hover:border-indigo-300",
  },
  {
    title: "Donor Communication",
    desc: "Generate professional outreach email templates.",
    icon: MessageSquare,
    prompt: "Provide me a standard email template for reaching out to new corporate donors for CPW.",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/50 hover:border-emerald-300",
  },
];

function parseSuggestedQuestions(content: string) {
  const marker = "💡 Suggested Questions:";
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    return { mainContent: content, questions: [] };
  }

  const mainContent = content.slice(0, markerIndex).trim();
  const suggestedSection = content.slice(markerIndex + marker.length);
  const questions = suggestedSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line))
    .map((line) => {
      if (line.startsWith("-") || line.startsWith("*")) {
        return line.slice(1).trim();
      }
      return line.replace(/^\d+\./, "").trim();
    })
    .map((q) => q.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return { mainContent, questions };
}

const AgentPage = () => {
  const messages = useChatStore((state) => state.messages);
  const isSending = useChatStore((state) => state.isSending);
  const isFetchingThreads = useChatStore((state) => state.isFetchingThreads);
  const error = useChatStore((state) => state.error);
  const threads = useChatStore((state) => state.threads);
  const totalCount = useChatStore((state) => state.totalCount);
  const showThreads = useChatStore((state) => state.showThreads);
  const conversationId = useChatStore((state) => state.conversationId);

  const sendMessage = useChatStore((state) => state.sendMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const fetchThreads = useChatStore((state) => state.fetchThreads);
  const loadThread = useChatStore((state) => state.loadThread);
  const toggleThreads = useChatStore((state) => state.toggleThreads);
  const deleteThread = useChatStore((state) => state.deleteThread);
  const deleteAllThreads = useChatStore((state) => state.deleteAllThreads);
  const updateThreadTitle = useChatStore((state) => state.updateThreadTitle);
  const deleteMultipleThreads = useChatStore((state) => state.deleteMultipleThreads);

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());

  const handleToggleSelectThread = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Load threads on mount
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // Refresh threads when a new conversation is created
  useEffect(() => {
    if (conversationId) {
      fetchThreads();
    }
  }, [conversationId, fetchThreads]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage],
  );

  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleLoadThread = useCallback(
    (id: string) => {
      loadThread(id);
    },
    [loadThread],
  );

  const handleDeleteThread = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this conversation?")) {
        deleteThread(id);
      }
    },
    [deleteThread],
  );

  const handleDeleteAllThreads = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete all conversations? This cannot be undone.")) {
      await deleteAllThreads();
    }
  }, [deleteAllThreads]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter threads based on search input
  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex overflow-hidden bg-gray-50/50">
      {/* Threads Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: showThreads ? 288 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-shrink-0 border-r border-gray-200 bg-white/80 backdrop-blur-md overflow-hidden flex flex-col"
      >
        <div className="w-72 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-[73px] px-4 py-4 border-b border-gray-200/80 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                Conversations
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full" title="Total conversations in database">
                  {totalCount}
                </span>
                {threads.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(prev => !prev);
                        setSelectedThreadIds(new Set());
                      }}
                      className={`p-1 rounded-md text-xs font-semibold px-2 transition-all ${
                        isSelectionMode
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                      title="Select threads to delete"
                    >
                      {isSelectionMode ? "Cancel" : "Select"}
                    </button>
                    {!isSelectionMode && (
                      <ConfirmModal
                        title="Delete All Conversations"
                        message="Are you sure you want to delete all conversations? This cannot be undone."
                        yesLabel="Delete All"
                        noLabel="Cancel"
                        onSelect={(choice) => {
                          if (choice === "yes") {
                            deleteAllThreads();
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-all animate-fade-in"
                          title="Delete all conversations"
                        >
                          <Trash2 size={13} />
                        </button>
                      </ConfirmModal>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isFetchingThreads ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">No discussions found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredThreads.map((thread) => {
                  const isActive = conversationId === thread.conversationId;
                  const isEditing = editingThreadId === thread.conversationId;
                  const isSelected = selectedThreadIds.has(thread.conversationId);
                  return (
                    <motion.div
                      key={thread.conversationId}
                      layoutId={`thread-${thread.conversationId}`}
                      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50/80 border border-blue-100/50 shadow-sm"
                          : isSelected
                          ? "bg-blue-50/40 border border-blue-100/30 shadow-none"
                          : "hover:bg-gray-100/60 border border-transparent"
                      }`}
                      onClick={(e) => {
                        if (isSelectionMode) {
                          handleToggleSelectThread(e, thread.conversationId);
                        } else if (!isEditing) {
                          handleLoadThread(thread.conversationId);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-6 flex-1">
                        {isSelectionMode ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelectThread(e, thread.conversationId)}
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "border-gray-300 hover:border-blue-400 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <Check size={10} className="stroke-[3]" />
                            )}
                          </button>
                        ) : (
                          <MessageSquare
                            size={15}
                            className={`mt-0.5 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editTitleText.trim()) {
                                    updateThreadTitle(thread.conversationId, editTitleText.trim());
                                  }
                                  setEditingThreadId(null);
                                } else if (e.key === "Escape") {
                                  setEditingThreadId(null);
                                }
                              }}
                              onBlur={() => {
                                if (editTitleText.trim()) {
                                  updateThreadTitle(thread.conversationId, editTitleText.trim());
                                }
                                setEditingThreadId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                          ) : (
                            <p
                              className={`text-xs font-medium truncate ${isActive ? "text-blue-900" : "text-gray-700"}`}
                            >
                              {thread.title}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                            <Clock size={10} />
                            <span>{formatDate(thread.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {!isEditing && !isSelectionMode && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingThreadId(thread.conversationId);
                              setEditTitleText(thread.title);
                            }}
                            className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-500"
                            title="Rename chat log"
                          >
                            <Edit2 size={11} />
                          </button>
                          <ConfirmModal
                            title="Delete Conversation"
                            message="Are you sure you want to delete this conversation? This cannot be undone."
                            yesLabel="Delete"
                            noLabel="Cancel"
                            onSelect={(choice) => {
                              if (choice === "yes") {
                                deleteThread(thread.conversationId);
                              }
                            }}
                          >
                            <button
                              type="button"
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                              title="Delete chat log"
                            >
                              <Trash2 size={11} />
                            </button>
                          </ConfirmModal>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bulk Action Selection Footer */}
          <AnimatePresence>
            {isSelectionMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 bg-gray-50/90 backdrop-blur-md p-4 flex flex-col gap-3 shrink-0"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>{selectedThreadIds.size} Selected</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedThreadIds.size === filteredThreads.length) {
                        setSelectedThreadIds(new Set());
                      } else {
                        setSelectedThreadIds(new Set(filteredThreads.map((t) => t.conversationId)));
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                  >
                    {selectedThreadIds.size === filteredThreads.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedThreadIds(new Set());
                    }}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <ConfirmModal
                    title="Delete Selected Conversations"
                    message={`Are you sure you want to delete the ${selectedThreadIds.size} selected conversations? This action cannot be undone.`}
                    yesLabel="Delete Selected"
                    noLabel="Cancel"
                    onSelect={async (choice) => {
                      if (choice === "yes" && selectedThreadIds.size > 0) {
                        await deleteMultipleThreads(Array.from(selectedThreadIds));
                        setSelectedThreadIds(new Set());
                        setIsSelectionMode(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      disabled={selectedThreadIds.size === 0}
                      className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </ConfirmModal>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Workspace Header */}
        <div className="h-[73px] flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/70 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleThreads}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title={showThreads ? "Collapse sidebar" : "Expand sidebar"}
            >
              {showThreads ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                CPW AI Assistant
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-[10px] text-gray-400">Powered by LangGraph & Pinecone RAG</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full font-medium">
                {error}
              </span>
            )}
            {hasMessages && (
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-black text-white hover:bg-black/90 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={14} />
                New Conversation
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {!hasMessages ? (
          <div className="flex-1 flex flex-col justify-center items-center px-6 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-2xl text-center space-y-8 py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center mb-6"
              >
                <div className="w-32 h-32 mb-2 bg-white rounded-full p-2 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
                  <Image
                    src={agentWelcome}
                    alt="CPW AI Agent"
                    width={110}
                    height={110}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="text-center mt-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">CPW Intelligence Hub</h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                    Ask about fundraisers, analyze donations, verify center installation statuses, or draft outreach documents.
                  </p>
                </div>
              </motion.div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                {SUGGESTIONS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                      className={`p-4 rounded-2xl border bg-gradient-to-br ${s.color} cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-36 group`}
                      onClick={() => handleSend(s.prompt)}
                    >
                      <div>
                        <div className="p-2 bg-white/80 rounded-xl w-fit mb-3 shadow-sm border border-black/5">
                          <Icon size={16} />
                        </div>
                        <h3 className="text-xs font-semibold text-gray-900 mb-1">{s.title}</h3>
                        <p className="text-[10px] text-gray-600 leading-normal">{s.desc}</p>
                      </div>
                      <div className="flex items-center justify-end text-[10px] font-bold gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ask
                        <ArrowRight size={10} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-6">
                <AgentTextArea onSend={handleSend} disabled={isSending} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/30 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    const parsedData = isUser ? null : parseSuggestedQuestions(message.content);

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm p-1">
                            <Image src={agentIcon} alt="Agent" width={28} height={28} className="object-contain" />
                          </div>
                        )}

                        <div className="space-y-1.5 max-w-[80%]">
                          <div
                            className={`px-4 py-3 text-sm leading-relaxed ${isUser
                              ? "rounded-2xl rounded-tr-none bg-black text-white shadow-sm"
                              : "rounded-2xl rounded-tl-none bg-white border border-gray-100 text-gray-800 shadow-sm"
                              }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="space-y-3">
                                {message.status === "thinking" || (message.status === "streaming" && !parsedData!.mainContent.trim()) ? (
                                  <div className="flex items-center gap-2.5 text-gray-500 py-1 font-medium text-xs">
                                    <RefreshCw size={14} className="animate-spin text-blue-500" />
                                    <span>{message.loadingStatus || "Synthesizing answer..."}</span>
                                  </div>
                                ) : (
                                  <MarkdownRenderer content={parsedData!.mainContent.trimStart()} isStreaming={message.status === "streaming"} onSendMessage={handleSend} messageCreatedAt={message.createdAt} />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Render Suggested Questions directly below the bubble */}
                          {!isUser && parsedData && parsedData.questions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {parsedData.questions.map((q, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSend(q)}
                                  className="text-left text-[11px] font-medium px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 px-1 pt-1 mt-1">
                            {!isUser && parsedData && (
                              <button
                                onClick={() => handleCopy(message.id, parsedData.mainContent)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copy message"
                              >
                                {copiedId === message.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            )}
                            <span className="text-[9px] text-gray-400/80">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {isUser && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700 text-xs font-bold font-mono shadow-sm">
                            U
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Loading state message bubble */}
                {isSending &&
                  messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 justify-start"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm p-1">
                        <Image src={agentIcon} alt="Agent" width={28} height={28} className="object-contain" />
                      </div>
                      <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-white border border-gray-100 px-4 py-3.5 text-sm shadow-sm">
                        <div className="flex items-center gap-2.5 text-gray-500 font-medium text-xs">
                          <RefreshCw size={14} className="animate-spin text-blue-500" />
                          <span>{messages[messages.length - 1]?.loadingStatus || "Searching Pinecone & compiling response..."}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="px-6 py-4 bg-white">
              <AgentTextArea onSend={handleSend} disabled={isSending} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentPage;
