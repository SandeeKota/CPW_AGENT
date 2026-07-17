export class SimpleCrossDomainAuth {
  private static readonly AUTH_PARAM = "auth";
  private static readonly COGNITO_STORAGE_KEY =
    "CognitoIdentityServiceProvider";

  // Get Cognito data from localStorage and encode it
  static getCognitoAuthData(): string | null {
    try {
      const cognitoData: Record<string, any> = {};

      // Get all Cognito-related items from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.COGNITO_STORAGE_KEY)) {
          const value = localStorage.getItem(key);
          if (value) {
            cognitoData[key] = value;
          }
        }
      }

      if (Object.keys(cognitoData).length === 0) {
        return null;
      }

      // Encode the object
      const encodedData = btoa(JSON.stringify(cognitoData));
      return encodedData;
    } catch (error) {
      console.error("Error getting Cognito auth data:", error);
      return null;
    }
  }

  // Generate cross-domain URL with encoded auth data
  static generateCrossDomainUrl(
    targetDomain: string,
    targetPath: string = "/",
  ): string | null {
    const authData = this.getCognitoAuthData();

    if (!authData) {
      console.error("No auth data available");
      return null;
    }

    const url = new URL(targetPath, `http://${targetDomain}`);
    url.searchParams.set(this.AUTH_PARAM, authData);

    return url.toString();
  }

  // Extract and decode auth data from URL, then store in localStorage
  static handleIncomingAuth(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedAuthData = urlParams.get(this.AUTH_PARAM);

      if (!encodedAuthData) {
        return false;
      }

      // Decode the auth data
      const decodedData = JSON.parse(atob(encodedAuthData));

      // Store each Cognito key back to localStorage
      Object.entries(decodedData).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });

      // Clean the URL by removing auth parameter
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(this.AUTH_PARAM);
      window.history.replaceState({}, document.title, cleanUrl.toString());

      console.log("Cross-domain auth data restored successfully");
      return true;
    } catch (error) {
      console.error("Error handling incoming auth:", error);
      return false;
    }
  }

  // Check if user is authenticated by looking for Cognito tokens
  static isAuthenticated(): boolean {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.includes("idToken") &&
          key.startsWith(this.COGNITO_STORAGE_KEY)
        ) {
          const token = localStorage.getItem(key);
          if (token && token !== "undefined" && token !== "null") {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Get current user info from localStorage
  static getCurrentUserInfo(): any {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.includes("userData") &&
          key.startsWith(this.COGNITO_STORAGE_KEY)
        ) {
          const userData = localStorage.getItem(key);
          if (userData) {
            return JSON.parse(userData);
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  }

  // Clear all Cognito data (for logout)
  static clearCognitoData(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.COGNITO_STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log("Cognito data cleared");
    } catch (error) {
      console.error("Error clearing Cognito data:", error);
    }
  }
}
