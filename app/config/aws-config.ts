import { Amplify } from "aws-amplify";
import config from "./config";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: config.cognito.userPoolClientId,
      userPoolId: config.cognito.userPoolId,
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
