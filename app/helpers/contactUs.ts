import api from "../_services/api_service";
import { ContactForm } from "../_types/contactUs";

export const createContact = async (body: ContactForm) => {
  if (!body) return false;
  try {
    const res = await api.post("/v1/contact/submit", body);
    if (res && res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
