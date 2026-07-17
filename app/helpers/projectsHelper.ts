import api from "../_services/api_service";

export const getProgectsList = async () => {
  try {
    const response = await api.get("/v2/projects");
    if (response?.data?.projects) {
      return response?.data?.projects || [];
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const getProjectById = async (id: string) => {
  try {
    const response = await api.get(`/v2/projects/${id}`);
    if (response?.data && !response.data.error) {
      return await response.data;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
