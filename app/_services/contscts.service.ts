import api from "./api_service";

export const getContacts = async (
  page?: number,
  pageSize?: number,
  search?: string,
) => {
  try {
    const response = await api.get(
      "/v1/contact/submissions?page=" + page?.toString() ||
        "1" + "&limit=" + pageSize?.toString() ||
        "10" + "&search=" + search ||
        "",
    );
    if (
      response &&
      response?.status === 200 &&
      response?.data &&
      response?.data?.data
    ) {
      const obj = {
        data: response?.data?.data,
        pagination: response?.data?.pagination,
      };
      return obj;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const deleteContactById = async (id: string) => {
  try {
    const response = await api.delete(`/v1/contact/delete/${id}`);
    if (response && (response.status === 200 || response.status === 204)) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
