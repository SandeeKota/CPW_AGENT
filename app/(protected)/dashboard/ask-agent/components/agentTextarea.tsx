"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, CornerDownLeft } from "lucide-react";

interface AgentTextAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const AgentTextArea = ({ onSend, disabled }: AgentTextAreaProps) => {
  const [message, setMessage] = useState("");
  const [isMultiLine, setIsMultiLine] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height first
    textarea.style.height = "0px";

    const scrollHeight = textarea.scrollHeight;
    // Grow based on content
    textarea.style.height = `${Math.min(scrollHeight, 192)}px`;

    // Dynamic threshold: single line is typically <= 28px
    setIsMultiLine(scrollHeight > 32);
  };

  useEffect(() => {
    resizeTextarea();
  }, [message]);

  const handleSubmit = () => {
    const value = message.trim();
    if (!value || disabled) return;

    onSend(value);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`relative flex items-end gap-2 border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-300 ease-in-out ${
        isMultiLine ? "rounded-2xl" : "rounded-full"
      }`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          placeholder="Ask CPW-AGENT anything..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="
            flex-1
            resize-none
            bg-transparent
            text-sm
            leading-relaxed
            placeholder-gray-400
            text-gray-800
            focus:outline-none
            overflow-y-auto
            max-h-48
            pl-1.5
            pr-12
            py-1
            custom-scrollbar-text-area
            disabled:opacity-50
          "
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {message.trim() && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-semibold text-gray-400 bg-gray-50 border border-gray-200/60 rounded px-1.5 py-0.5 select-none">
              <span>Enter</span>
              <CornerDownLeft size={8} />
            </span>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-black
              text-white
              transition-all
              hover:bg-gray-900
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-30
              disabled:scale-100
              shadow-sm
            "
            title="Send query"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-400/80 text-center mt-2 font-medium">
        Press Shift + Enter for new lines
      </p>
    </div>
  );
};

export default AgentTextArea;
