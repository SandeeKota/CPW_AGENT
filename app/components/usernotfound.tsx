"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Button } from "./ui/button";

type Props = {
  message: string;
};

const UserNotFound: React.FC<Props> = ({ message }) => {
  return (
    <div className="w-screen h-screen flex justify-center items-center flex-col gap-3 ">
      <strong>user not found</strong>
      <strong>try with another account</strong>
      <Button className="mt-4" onClick={() => {}} variant={"default"}>
        Sign In / Sign Up
      </Button>
    </div>
  );
};

export default UserNotFound;
