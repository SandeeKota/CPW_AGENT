"use client";
import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  title?: string;
  message?: string;
  yesLabel?: string;
  noLabel?: string;
  onSelect: (choice: "yes" | "no") => void;
  children: React.ReactNode; // Trigger button
};

export default function ConfirmModal({
  title = "Are you sure?",
  message = "Do you want to proceed with this action?",
  yesLabel = "Yes",
  noLabel = "No",
  onSelect,
  children,
}: ConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSelect = (choice: "yes" | "no") => {
    setIsOpen(false);
    onSelect(choice);
  };

  const modalContent = isOpen && (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999999]"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white rounded-lg shadow-lg p-6 max-w-[500px] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-row justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => handleSelect("no")}
          >
            {noLabel}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => handleSelect("yes")}
          >
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }} 
        className="inline-block"
      >
        {children}
      </div>

      {/* Portal Modal */}
      {mounted && typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
