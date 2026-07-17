// stores/useVerifyingStore.ts
import { create } from "zustand";

interface VerifyingState {
  isVerifying: boolean;
  startVerifying: () => void;
  stopVerifying: () => void;
}

export const useDonationVerifyingStore = create<VerifyingState>((set) => ({
  isVerifying: false,
  startVerifying: () => set({ isVerifying: true }),
  stopVerifying: () => set({ isVerifying: false }),
}));
