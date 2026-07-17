"use client";
import React from "react";
import Image from "next/image";

const TransparentLoader = () => {
  return (
    <div className="fixed inset-0 top-0 left-0 z-[1000] bg-black bg-opacity-50 w-screen h-screen  ">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
        {/* Spinning Loader */}
        <Image
          src={require("@/assets/pyramid-19501_256.gif")}
          alt="Loading..."
          width={200}
          height={200}
          className="w-40 h-40 transform translate-x-1/3"
          loading="eager"
        />
        {/* <div className="flex space-x-2 mt-4 transform translate-x-1/2 ">
                    <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                </div> */}
      </div>
    </div>
  );
};

export default TransparentLoader;
