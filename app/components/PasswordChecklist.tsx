// components/PasswordChecklist.tsx
import { Check, X } from "lucide-react";
import { passwordRules } from "../stores/authStore";

export const PasswordChecklist = ({ password }: { password: string }) => (
  <ul className="text-sm space-y-1 mt-2">
    {passwordRules.map((rule, idx) => {
      const passed = rule.test(password);
      return (
        <li
          key={idx}
          className={`flex items-center gap-2 ${
            passed ? "text-green-600" : "text-red-500"
          }`}
        >
          {passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {rule.label}
        </li>
      );
    })}
  </ul>
);
