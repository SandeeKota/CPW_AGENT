// context/SnackbarContext.tsx
"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import Snackbar from "./Snackbar";
import {
  SnackbarOptions,
  SnackbarPosition,
  SnackbarType,
} from "../stores/snackbat.type";

type SnackbarContextType = {
  show: (message: string, options?: SnackbarOptions) => void;
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
);

export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("success");
  const [position, setPosition] = useState<SnackbarPosition>("bottom");
  const [isOpen, setIsOpen] = useState(false);

  const show = useCallback((msg: string, options?: SnackbarOptions) => {
    setMessage(msg);
    setType(options?.type || "success");
    setPosition(options?.position || "bottom");
    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
    }, options?.duration || 3000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <Snackbar
        message={message}
        isOpen={isOpen}
        position={position}
        type={type}
        onClose={() => setIsOpen(false)}
      />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
