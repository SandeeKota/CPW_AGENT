// components/Snackbar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import React from "react";

export type SnackbarProps = {
  message: string;
  type?: "success" | "warning" | "danger" | "failed";
  position?: "top" | "bottom" | "left" | "right" | "center";
  isOpen: boolean;
  onClose?: () => void;
};

const typeStyles = {
  success: "bg-green-600 text-white",
  warning: "bg-yellow-400 text-black",
  danger: "bg-red-600 text-white",
  failed: "bg-gray-700 text-white",
};

const getPositionStyle = (position: string) => {
  switch (position) {
    case "top":
      return "top-4 left-1/2 -translate-x-1/2";
    case "bottom":
      return "bottom-4 left-1/2 -translate-x-1/2";
    case "left":
      return "top-1/2 left-4 -translate-y-1/2";
    case "right":
      return "top-1/2 right-4 -translate-y-1/2";
    case "center":
    default:
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  }
};

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  type = "success",
  position = "bottom",
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={clsx(
            "fixed z-[4000] px-6 py-3 rounded-lg shadow-md min-w-[200px] max-w-sm text-center",
            typeStyles[type],
            getPositionStyle(position),
          )}
          initial={{ opacity: 0, y: position === "top" ? -30 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -30 : 30 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Snackbar;
