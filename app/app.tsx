import React from "react";
import DashboardLayout from "./components/layout/dashboard-layout";
import TransparentLoader from "./components/transparent-Loader";

interface Props {
  children: React.ReactNode;
}
const AppMain: React.FC<Props> = ({ children }) => {
  return (
    <React.Fragment>
      <DashboardLayout>{children}</DashboardLayout>
    </React.Fragment>
  );
};

export default AppMain;
