"use client";

import { useGetAuthUserQuery } from "@/state/api";
import Navbar from "../../components/Navbar";
import { NAVBAR_HEIGHT } from "../../lib/constants";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  console.log("AuthUser: ", authUser);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();
      if (
        (userRole === "manager" && pathname.startsWith("/search")) ||
        (userRole === "manager" && pathname === "/")
      ) {
        router.push(
          "/managers/properties",
          { scroll: false }
        );
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <>Loading....</>;

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
