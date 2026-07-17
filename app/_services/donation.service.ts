import type {
  DonationTaxExemptionDetails,
  PanVerificationResponse,
} from "@/app/_types/dination.type";
import { PanVerificationResponseSchema } from "@/app/_types/dination.type";
import api from "./api_service";

export const verifyPanForDonation = async (
  pan: string,
  name_as_per_pan: string,
): Promise<PanVerificationResponse> => {
  const response = await api.post("/v1/donations/verify-pan", {
    pan,
    name_as_per_pan,
    consent: true,
  });

  return PanVerificationResponseSchema.parse(response.data);
};

export const saveDonationTaxExemptionDetails = async ({
  donationId,
  taxExemptionDetails,
  panVerificationResponse,
}: {
  donationId: string;
  taxExemptionDetails: DonationTaxExemptionDetails;
  panVerificationResponse: PanVerificationResponse;
}) => {
  const response = await api.put(
    `/v1/donations/${donationId}/tax-exemption-details`,
    {
      tax_exemption_certificate_required: true,
      tax_exemption_details: taxExemptionDetails,
      pan_verification_response: panVerificationResponse,
    },
  );

  return response.data;
};
