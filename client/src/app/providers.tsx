"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import StoreProviders from "../state/redux";
import Auth from "./(auth)/authProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProviders>
      <Authenticator.Provider>
        <Auth>{children}</Auth>
      </Authenticator.Provider>
    </StoreProviders>
  );
};

export default Providers;
