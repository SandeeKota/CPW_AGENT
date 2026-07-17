import { Amplify } from "aws-amplify";
import config from "../config/config";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  signOut,
  resetPassword,
  confirmResetPassword,
  updatePassword,
} from "aws-amplify/auth";

type CognitoAuthSuccess = {
  status: "SUCCESS";
  isSignedIn: true;
};

type CognitoAuthChallenge = {
  status: "OTP_REQUIRED";
  isSignedIn: false;
  nextStep: string;
  challengeMessage: string;
  deliveryMedium: string;
};

export type CognitoAuthResponse = CognitoAuthSuccess | CognitoAuthChallenge;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: config.cognito.userPoolClientId,
      userPoolId: config.cognito.userPoolId,
    },
  },
});

const cognitoService = {
  login: async (email: string, password: string) => {
    try {
      const response = await signIn({
        username: email,
        password: password,
      });
      return await handleSignInResponse(response);
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },
  confirmLoginOtp: async (otp: string) => {
    try {
      const response = await confirmSignIn({
        challengeResponse: otp,
      });
      return await handleSignInResponse(response);
    } catch (error) {
      console.error("Error confirming OTP:", error);
      throw error;
    }
  },
  logout: async () => {
    try {
      console.log("Logout Called");

      localStorage.setItem("access_token", "");
      await signOut({ global: true });
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      return false;
    }
  },
  getSession: async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (token) localStorage.setItem("access_token", token);
      return token || null;
    } catch (error) {
      console.error("Session fetch failed:", error);
      return null;
    }
  },
  forgotPassword: async (email: string) => {
    // const accountResp = await this.accountAccessCheck(email);
    // if (accountResp.error) {
    //     throw accountResp;
    // }

    const result = await resetPassword({ username: email });
    const { deliveryMedium, destination } =
      result.nextStep?.codeDeliveryDetails || {};
    const { challengeMessage, medium } = getMfaDestinationText(
      deliveryMedium,
      destination,
    );

    return {
      nextAction: "MFA_CHALLENGE",
      challengeMessage,
      deliveryMedium: medium,
    };
  },

  confirmForgotPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    const result = await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    return { nextAction: "AUTH_SUCCESS" };
  },
  updateUserPassword: async (oldPassword: string, newPassword: string) => {
    try {
      await updatePassword({ oldPassword, newPassword });
      return { success: true, message: "Password updated successfully" };
    } catch (error: any) {
      console.error("Error updating password:", error);
      return {
        success: false,
        message:
          error.message || "Something went wrong while updating the password",
      };
    }
  },
};

export default cognitoService;

function getMfaDestinationText(deliveryMedium: any, destination?: string) {
  let medium = "sms";
  let challengeMessage = "OTP is sent to your registered email/phone number";
  if (deliveryMedium && destination) {
    const deliveryMediumText =
      deliveryMedium === "EMAIL" ? "email" : "phone number";
    medium = deliveryMedium === "EMAIL" ? "email" : "sms";
    challengeMessage = `OTP is sent to your registered ${deliveryMediumText} (${destination})`;
  }
  return { challengeMessage, medium };
}

async function handleSignInResponse(
  response: any,
): Promise<CognitoAuthResponse> {
  const { isSignedIn, nextStep } = response || {};

  if (isSignedIn || nextStep?.signInStep === "DONE") {
    await cognitoService.getSession();
    return { status: "SUCCESS", isSignedIn: true };
  }

  return getOtpChallengeResponse(nextStep);
}

function getOtpChallengeResponse(nextStep: any): CognitoAuthChallenge {
  const step = nextStep?.signInStep || "";
  const deliveryDetails =
    nextStep?.codeDeliveryDetails || nextStep?.deliveryDetails || {};
  const { deliveryMedium, destination } = deliveryDetails;
  const { challengeMessage, medium } = getMfaDestinationText(
    deliveryMedium,
    destination,
  );

  return {
    status: "OTP_REQUIRED",
    isSignedIn: false,
    nextStep: step,
    challengeMessage,
    deliveryMedium: medium,
  };
}
