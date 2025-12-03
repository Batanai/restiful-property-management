"use client";

import { useGetAuthUserQuery } from "@/state/api";
import Navbar from "../../components/Navbar";
import { NAVBAR_HEIGHT } from "../../lib/constants";
import React, { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { usePathname, useRouter } from "next/navigation";

const DashboardContent = ({
  children,
  authUser,
}: {
  children: React.ReactNode;
  authUser: any;
}) => {
  const { open, isMobile } = useSidebar();

  return (
    <div className="min-h-screen w-full bg-primary-100">
      <Navbar />
      <main className={`flex`} style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <Sidebar userType={authUser?.userRole?.toLowerCase()} />
        <div
          className="flex-grow transition-all duration-300"
          style={{
            marginLeft: isMobile ? "0" : open ? "16rem" : "3rem",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  console.log("AuthUser: ", authUser);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();
      if (
        (userRole === "manager" && pathname.startsWith("/tenants")) ||
        (userRole === "tenant" && pathname.startsWith("/managers"))
      ) {
        router.push(
          userRole === "manager"
            ? "/managers/properties"
            : "/tenants/favorites",
          { scroll: false }
        );
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <>Loading....</>;
  if (authUser?.userRole === null) return null;

  return (
    <SidebarProvider>
      <DashboardContent authUser={authUser}>{children}</DashboardContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
