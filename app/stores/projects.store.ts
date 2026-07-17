import { create } from "zustand";
import { ProjectModal } from "../_types/project.types";
import api from "../_services/api_service";
import { getProjectById } from "../helpers/projectsHelper";

interface ProjectsZustandStore {
  publicProjects: ProjectModal[];
  setPublicProjects: (projects: ProjectModal[]) => void;
  clearPublicProjects: () => void;
  fetchPublicProjects: (status?: string) => void;
  getProjectById: (id: string) => Promise<ProjectModal | false>; // ✅ correct return type
}

export const useProjectsStore = create<ProjectsZustandStore>((set) => ({
  publicProjects: [],
  setPublicProjects: (projects) => set({ publicProjects: projects }),
  clearPublicProjects: () => set({ publicProjects: [] }),
  fetchPublicProjects: async (status) => {
    try {
      const res = await api.get(`/v1/projects/public?status=${status || ""}`);
      if (res && res.status === 200) {
        const response = res.data;
        if (response.success && Array.isArray(response.data)) {
          set({ publicProjects: response.data });
        } else {
          set({ publicProjects: [] });
        }
      } else {
        set({ publicProjects: [] });
      }
    } catch (err) {
      set({ publicProjects: [] });
    }
  },
  getProjectById: async (id: string) => {
    try {
      const res = await api.get(`/v1/projects/${id}/public`);
      const response = res.data;
      if (res.status === 200 && response.project) {
        return response.project;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  },
}));

export const checkProjectAmountToCreateFundraiser = async (
  amount: number,
  currency: string,
  projectId: string,
) => {
  try {
    const body = { amount: amount, currency: currency, projectId: projectId };
    const res = await api.post(`/v1/projects/check-amount`, body);

    if (res.data) {
      return res.data;
    }
  } catch (error) {
    const data = {
      message: error instanceof Error ? error.message : "",
      avaliable: {} as any,
    };
    return data;
  }
};
