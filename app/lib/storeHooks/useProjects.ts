// lib/storeHooks/useProjects.ts
import { useState } from "react";
import api from "@/app/_services/api_service";
import { ProjectModal } from "@/app/_types/project.types";

interface ProjectResponse {
  success: boolean;
  data: ProjectModal[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ProjectRemainingAmountResponse {
  projectId: string;
  baseCurrency: string;
  remainingAmount: {
    USD: number;
    INR: number;
    EUR: number;
    GBP: number;
  };
}

export const useProjectsHook = () => {
  const [projects, setProjects] = useState<ProjectModal[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (
    page?: number,
    pageSize?: number,
    statusFilter?: string,
    search: string = "",
    centerType: string = "",
  ) => {
    try {
      setLoading(search ? false : true);
      const res = await api.get("/v1/projects/my-projects", {
        params: {
          page: page || "",
          pageSize: pageSize || "",
          status: statusFilter || "",
          search: search || "",
          center_type: centerType || "",
        },
      });
      const response: ProjectResponse = res.data;
      if (res.status === 200 && response.success && response.data) {
        setProjects(response.data);
        setTotalPages(response.pagination.totalPages || 1);
        setCurrentPage(response.pagination.currentPage || 1);
        setTotalCount(response.pagination.totalCount || 0);
        setError(null);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError("Error fetching projects");
      setProjects([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: ProjectModal) => {
    setProjects((prevProjects) => [...prevProjects, project]);
  };

  const updateProject = async (updatedProject: ProjectModal) => {
    setProjects((prevProjects: ProjectModal[]) =>
      prevProjects.map((project: ProjectModal) =>
        project._id === updatedProject._id ? updatedProject : project,
      ),
    );
  };

  const getProjectBy_id = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/projects/${id}/public`);
      const response = res.data;
      if (res.status === 200 && response.project) {
        return response.project;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  return {
    projects,
    totalPages,
    currentPage,
    totalCount,
    loading,
    error,
    fetchProjects,
    updateProject,
    addProject,
    getProjectBy_id,
  };
};

export const getProjectRemainingAmount = async (projectId: string) => {
  try {
    const res = await api.get(`/v1/projects/${projectId}/remaining`);
    if (res.data && res.status === 200) {
      return res.data as ProjectRemainingAmountResponse;
    } else throw new Error("Something went wrong");
  } catch (error) {
    return false;
  }
};
