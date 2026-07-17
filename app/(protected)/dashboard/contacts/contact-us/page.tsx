"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactFormValues, contactSchema } from "@/app/_types/contactUs";
import { createContact } from "@/app/helpers/contactUs";
import AnimatedCheck from "@/lib/animatedcheck";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";

const INQUIRY_TYPES = [
  "General Query",
  "Feedback",
  "Press Inquiry",
  "Partnership",
  "Support",
  "Other",
];

const ContactUs = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: {
      inquiryType: "",
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const messageValue = form.watch("message") || "";

  const submitHandler = async (data: ContactFormValues) => {
    try {
      setLoading(true);
      const res = await createContact(data);
      setLoading(false);
      if (res) {
        setShowAlert(true);
        setStatus("success");
        setTimeout(() => setShowAlert(false), 8000);
        form.reset();
        form.trigger();
      } else {
        setShowAlert(true);
        setStatus("error");
      }
    } catch {
      setShowAlert(true);
      setStatus("error");
    }
  };

  const inputBase =
    "w-full h-11 rounded-lg border bg-white px-4 text-sm text-[#173945] outline-none transition-colors placeholder:text-gray-400 focus:border-[#227077] focus:ring-2 focus:ring-[#227077]/20";
  const labelBase = "block text-sm font-semibold text-[#173945] mb-1.5";
  const errorBase = "mt-1 text-xs text-red-500";

  return (
    <div className="w-full flex-1 overflow-x-hidden overflow-y-auto py-4 md:py-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col py-8">
        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1 h-6 rounded-full bg-[#d46535]" />
            <h1 className="text-2xl font-bold text-[#173945]">Contact Us</h1>
          </div>
          <p className="text-sm text-gray-500 ml-3">
            Write to us with queries, feedback, press inquiries, or any other
            concerns.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="w-full min-h-64 flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white shadow-sm">
            <Loader2 className="w-8 h-8 text-[#227077] animate-spin" />
            <p className="text-sm text-gray-500 font-medium">
              Sending your message...
            </p>
          </div>
        )}

        {/* Success / Error state */}
        {showAlert && !loading && (
          <div className="w-full min-h-64 flex flex-col items-center justify-center gap-6 rounded-xl border border-gray-100 bg-white shadow-sm py-12 mb-8">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${status === "success" ? "bg-[#227077]" : "bg-red-500"}`}
            >
              <AnimatedCheck
                className={status !== "success" ? "!bg-red-500" : ""}
                issuccess={status === "success"}
              />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#173945]">
                {status === "success" ? "Thank you!" : "Something went wrong"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {status === "success"
                  ? "We've received your message and will get back to you soon."
                  : "Please try submitting again."}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!showAlert && !loading && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 mb-8">
            <form
              onSubmit={form.handleSubmit(submitHandler)}
              className="flex flex-col gap-5"
            >
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-5">
                <div>
                  <label className={labelBase}>Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className={`${inputBase} ${form.formState.errors.name ? "border-red-400" : "border-gray-200"}`}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name?.message && (
                    <p className={errorBase}>
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelBase}>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`${inputBase} ${form.formState.errors.email ? "border-red-400" : "border-gray-200"}`}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email?.message && (
                    <p className={errorBase}>
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 grid-cols-1 gap-5">
                <div>
                  <label className={labelBase}>
                    Phone{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className={`${inputBase} ${form.formState.errors.phone ? "border-red-400" : "border-gray-200"}`}
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone?.message && (
                    <p className={errorBase}>
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelBase}>Inquiry Type</label>
                  <select
                    className={`${inputBase} ${form.formState.errors.inquiryType ? "border-red-400" : "border-gray-200"} cursor-pointer`}
                    {...form.register("inquiryType")}
                  >
                    <option value="">Select inquiry type</option>
                    {INQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.inquiryType?.message && (
                    <p className={errorBase}>
                      {form.formState.errors.inquiryType.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelBase}>Subject</label>
                <input
                  type="text"
                  placeholder="Enter the subject"
                  className={`${inputBase} ${form.formState.errors.subject ? "border-red-400" : "border-gray-200"}`}
                  {...form.register("subject")}
                />
                {form.formState.errors.subject?.message && (
                  <p className={errorBase}>
                    {form.formState.errors.subject.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelBase}>
                  Message{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (Min 20 characters)
                  </span>
                </label>
                <textarea
                  maxLength={2000}
                  placeholder="Enter your message"
                  className={`w-full min-h-[140px] rounded-lg border bg-white px-4 py-3 text-sm text-[#173945] outline-none resize-none transition-colors placeholder:text-gray-400 focus:border-[#227077] focus:ring-2 focus:ring-[#227077]/20 ${form.formState.errors.message ? "border-red-400" : "border-gray-200"}`}
                  {...form.register("message")}
                />
                <div className="flex items-center justify-between mt-1">
                  {form.formState.errors.message?.message ? (
                    <p className={errorBase}>
                      {form.formState.errors.message.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">
                    {messageValue.length}/2000
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!form.formState.isValid || loading}
                  className="px-8 py-2.5 rounded-lg bg-[#227077] text-white text-sm font-semibold hover:bg-[#1a5e64] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Office addresses */}
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
          <div
            className="rounded-xl border border-gray-100 bg-white shadow-sm p-5"
            style={{ borderTop: "3px solid #227077" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#227077] flex-shrink-0" />
              <h3 className="font-semibold text-[#173945] text-sm">
                Community Pure Water Foundation
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-6">
              P.O. Box 183, 1130 W. Chestnut St. Union,
              <br />
              NJ 07083
            </p>
            <a
              href="tel:+19084090202"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#227077] hover:text-[#1a5e64] font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +1 (908) 409-0202
            </a>
          </div>

          <div
            className="rounded-xl border border-gray-100 bg-white shadow-sm p-5"
            style={{ borderTop: "3px solid #d46535" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#d46535] flex-shrink-0" />
              <h3 className="font-semibold text-[#173945] text-sm">
                Community Development Foundation
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-6">
              H.N. 1-3-29/3, Street No. 4/3, Nandanavanam Colony,
              <br />
              Habsiguda, Hyderabad, Telangana-500007
            </p>
            <div className="flex flex-col gap-1 mt-3">
              <a
                href="mailto:jupally.rao@cpwf.org"
                className="inline-flex items-center gap-1.5 text-sm text-[#227077] hover:text-[#1a5e64] font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                jupally.rao@cpwf.org
              </a>
              <a
                href="tel:+914027206555"
                className="inline-flex items-center gap-1.5 text-sm text-[#227077] hover:text-[#1a5e64] font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                +91 40 – 27206555
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
