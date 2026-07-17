interface EnvironmentProps {
  production: boolean;
  baseUrl: string;
  agentBaseUrl: string;
  CloudfrontS3: string;
  RAZOREPAY_ORDER: string;
  RAZOREPAY_SUBSCRIPTION: string;
  cognito: {
    userPoolClientId: string;
    userPoolId: string;
  };
  WEBSITE_URL: string;
  DASHBOARD_URL: string;
  postHug: {
    POSTHOG_KEY: string;
    POSTHOG_HOST: string;
  };
}

interface Environment {
  development: EnvironmentProps;
  production: EnvironmentProps;
  beta: EnvironmentProps;
}

const devAuthUrl = "https://alpha-be.communitypurewater.org/api";
// const devAuthUrl = "http://localhost:3000/api";
const prodAuthUrl = "https://backend.communitypurewater.org/api";
const betaAuthUrl = "https://beta-be.communitypurewater.org/api";

// const devAgentUrl = "https://cpw-agent.onrender.com/api/v1";
const devAgentUrl = "http://localhost:4000/api/v1";
const prodAgentUrl = "https://agent.communitypurewater.org/api/v1";
const betaAgentUrl = "https://beta-agent.communitypurewater.org/api/v1";

const environments: Environment = {
  development: {
    production: false,
    baseUrl: devAuthUrl,
    agentBaseUrl: devAgentUrl,
    CloudfrontS3: "https://cpw-alpha-app.s3.ap-south-1.amazonaws.com/",
    RAZOREPAY_ORDER: `${devAuthUrl}/v1/payments/razorpay/create-order`,
    RAZOREPAY_SUBSCRIPTION: `${devAuthUrl}/v1/payments/razorpay/monthy-subscription`,
    cognito: {
      userPoolClientId: "4o0hne55pns4vt3go3jd2t9j3q",
      userPoolId: "ap-south-1_7pR8cXdo2",
    },
    WEBSITE_URL: "https://alpha.communitypurewater.org",
    DASHBOARD_URL: "https://ad.communitypurewater.org",
    postHug: {
      POSTHOG_KEY: "phc_nAbgrnpJvvwFzzzusECBchnXaCNRLxaMnGt4pSghZFeD",
      POSTHOG_HOST: "https://us.i.posthog.com",
    },
  },
  beta: {
    production: false,
    baseUrl: betaAuthUrl,
    agentBaseUrl: betaAgentUrl,
    CloudfrontS3: "https://cpw-beta-app.s3.ap-south-1.amazonaws.com/",
    RAZOREPAY_ORDER: `${betaAuthUrl}/v1/payments/razorpay/create-order`,
    RAZOREPAY_SUBSCRIPTION: `${betaAuthUrl}/v1/payments/razorpay/monthy-subscription`,
    cognito: {
      userPoolClientId: "5rdiv9r1gai52magghh8uau5g2",
      userPoolId: "ap-south-1_4VXvX9mxR",
    },
    WEBSITE_URL: "https://beta.communitypurewater.org",
    DASHBOARD_URL: "https://bd.communitypurewater.org",
    postHug: {
      POSTHOG_KEY: "phc_nAbgrnpJvvwFzzzusECBchnXaCNRLxaMnGt4pSghZFeD",
      POSTHOG_HOST: "https://us.i.posthog.com",
    },
  },
  production: {
    production: true,
    baseUrl: prodAuthUrl,
    agentBaseUrl: prodAgentUrl,
    CloudfrontS3: "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/", // required for production, add the correct Cloudfront S3 URL here
    RAZOREPAY_ORDER: `${prodAuthUrl}/v1/payments/razorpay/create-order`,
    RAZOREPAY_SUBSCRIPTION: `${prodAuthUrl}/v1/payments/razorpay/monthy-subscription`,
    cognito: {
      userPoolClientId: "201im6eq5t7ubrmg9qufftgip3",
      userPoolId: "ap-south-1_ftfmDTzYI",
    },
    WEBSITE_URL: "https://www.communitypurewater.org",
    DASHBOARD_URL: "https://dashboard.communitypurewater.org",
    postHug: {
      POSTHOG_KEY: "phc_nAbgrnpJvvwFzzzusECBchnXaCNRLxaMnGt4pSghZFeD",
      POSTHOG_HOST: "https://us.i.posthog.com",
    },
  },
};

const nextPublicEnv = (process.env.NEXT_PUBLIC_ENV || "").toLowerCase();
const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
const envType = nextPublicEnv || nodeEnv;
const isProduction = nextPublicEnv === "prod" || nextPublicEnv === "production";
const isBeta = nextPublicEnv === "beta";
const environmentName: keyof Environment = isProduction
  ? "production"
  : isBeta
    ? "beta"
    : "development";

console.log(
  "Dashboard Environment: ",
  envType,
  environmentName,
  process.env.NEXT_PUBLIC_ENV,
);

const config: EnvironmentProps = environments[environmentName];

export default config;
