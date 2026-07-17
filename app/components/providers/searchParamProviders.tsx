import React, { Suspense } from "react";

export default function SuspenseWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center">
          <span>Loading...</span>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
