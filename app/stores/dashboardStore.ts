import { create } from "zustand";

interface DashboardCard {
  totalActiveFundraisers: number;
  totalDonors: number;
  totalActiveProjects: number;
  totalRaised: number;
  averageDonations: number;
}

interface DashboardState {
  dashboardCards: DashboardCard | null;
  selectedCurrency: string;
  fundraisers: any[];
  donations: any[];
  isLoading: boolean;

  // Actions
  setDashboardCards: (cards: DashboardCard) => void;
  setSelectedCurrency: (currency: string) => void;
  setFundraisers: (fundraisers: any[]) => void;
  setDonations: (donations: any[]) => void;
  setLoading: (loading: boolean) => void;
  addFundraiser: (fundraiser: any) => void;
  updateFundraiser: (id: string, updates: any) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboardCards: null,
  selectedCurrency: "INR",
  fundraisers: [],
  donations: [],
  isLoading: false,

  setDashboardCards: (cards) => set({ dashboardCards: cards }),

  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  setFundraisers: (fundraisers) => set({ fundraisers }),

  setDonations: (donations) => set({ donations }),

  setLoading: (loading) => set({ isLoading: loading }),

  addFundraiser: (fundraiser) =>
    set((state) => ({
      fundraisers: [...state.fundraisers, fundraiser],
    })),

  updateFundraiser: (id, updates) =>
    set((state) => ({
      fundraisers: state.fundraisers.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    })),
}));
