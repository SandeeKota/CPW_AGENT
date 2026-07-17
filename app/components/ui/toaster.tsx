"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === "destructive";
        const Icon = isDestructive ? AlertCircle : CheckCircle2;

        return (
          <Toast key={id} {...props} className="hidden">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isDestructive
                  ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                  : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
