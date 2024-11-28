'use client'
// import { SessionProvider, useSession } from "next-auth/react";
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider, } from "@solana/wallet-adapter-react";
//import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SafePalWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
//import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");
// import { Session } from "next-auth";
// import { SendTransaction } from "./SendTransaction";
import { WorkspaceProvider } from "@/context/anchor";
// import { StakeMarket } from "./StakeMarket";

export const Connector = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const endpoint = "http://127.0.0.1:8899";
  
  const wallets = useMemo(
    () => [
      new SafePalWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* <SessionProvider session={session} refetchInterval={0}> */}
            <WorkspaceProvider>
              {children}
              {/* <StakeMarket /> */}
            </WorkspaceProvider>
          {/* </SessionProvider> */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}