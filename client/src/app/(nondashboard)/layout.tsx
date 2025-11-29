"use client";

import { useGetAuthUserQuery } from "@/state/api";
import Navbar from "../../components/Navbar";
import { NAVBAR_HEIGHT } from "../../lib/constants";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const {data: authUser} = useGetAuthUserQuery();
  console.log('AuthUser: ', authUser);

  return (
    <div className="h-full w-full">
      <Navbar />
      <main
        className={`h-full w-full flex flex-col`}
        style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
