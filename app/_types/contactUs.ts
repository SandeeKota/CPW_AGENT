import { z } from "zod";

export const phoneRegex = /^\+?[1-9][\d\s\-()]{7,19}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), {
      message: "Please enter a valid phone number",
    }),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const contactFormSchema = contactSchema;
export type ContactForm = ContactFormValues;
