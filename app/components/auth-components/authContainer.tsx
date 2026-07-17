"use client";

import { useState } from "react";
import LoginForm from "./loginForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import RegistrationForm from "./registrationForm";
import { useAuthStore } from "@/app/stores/authStore";
import LoadingScreen from "../loadingScreen";

type AuthView = "login" | "register" | "forgot-password";

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { authStatuChange } = useAuthStore();

  const handleViewChange = (view: AuthView) => {
    setIsRedirecting(false);
    setCurrentView(view);
  };

  const handleLoginSuccess = (userData: any) => {
    setIsRedirecting(true);
    authStatuChange(true);
  };

  const handleRegistrationSuccess = (userData: any) => {
    console.log("Registration successful:", userData);
    setIsRedirecting(true);
    authStatuChange(true);
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView("login");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            onForgotPassword={() => handleViewChange("forgot-password")}
            onRegister={() => handleViewChange("register")}
            onSuccess={handleLoginSuccess}
          />
        );
      case "register":
        return (
          <RegistrationForm
            onBackToLogin={() => handleViewChange("login")}
            onSuccess={handleRegistrationSuccess}
            onForgotPassword={() => handleViewChange("forgot-password")}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onBackToLogin={() => handleViewChange("login")}
            onSuccess={handleForgotPasswordSuccess}
          />
        );
      default:
        return (
          <LoginForm
            onForgotPassword={() => handleViewChange("forgot-password")}
            onRegister={() => handleViewChange("register")}
            onSuccess={handleLoginSuccess}
          />
        );
    }
  };

  if (isRedirecting) {
    return (
      <LoadingScreen message="Signing you in and opening your dashboard..." />
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-end bg-gray-50 py-12 px-4 sm:px-6 lg:px-8
        bg-[linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url('https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6339_11zon_1749618509746-1756101789056.jpg')]
        bg-center bg-cover bg-no-repeat
        "
    >
      {renderCurrentView()}
    </div>
  );
};

export default AuthContainer;
