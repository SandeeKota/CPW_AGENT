import { ProjectSchema, type ProjectModal } from "../_types/project.types";
import api from "./api_service";

export const createProject = async (
  project: ProjectSchema,
): Promise<ProjectModal[] | boolean> => {
  try {
    const res = await api.post("/v1/projects", project);
    if (res && res.status === 201 && res?.data?.project) {
      const projectData: ProjectModal[] = res?.data?.project;
      return projectData;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const updateProject = async (
  project: ProjectSchema,
  id: string,
): Promise<ProjectModal[] | boolean> => {
  try {
    if (!id) {
      return false;
    }
    const res = await api.put(`/v1/projects/${id}`, project);
    if (res && res.status === 200 && res?.data) {
      return res?.data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
