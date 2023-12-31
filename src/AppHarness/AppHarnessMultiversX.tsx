import React, { Suspense, useEffect, useState, useTransition } from "react";
import { useGetAccountInfo, useGetLoginInfo } from "@multiversx/sdk-dapp/hooks/account";
import { Loader } from "@multiversx/sdk-dapp/UI";
import AppMx from "App/AppMultiversX";
import { useLocalStorage } from "libs/hooks";
import { contractsForChain } from "libs/util";
import { useChainMeta } from "store/ChainMetaContext";
import { useUser } from "store/UserContext";

function CustomLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: "100vh",
      }}>
      <Loader />
    </div>
  );
}

const baseUserContext = {
  isMxAuthenticated: false,
}; // this is needed as context is updating async in this comp using _user is out of sync - @TODO improve pattern

function AppHarnessMx({ launchEnvironment, handleLaunchMode, onEVMConnection }: { launchEnvironment: any; handleLaunchMode: any; onEVMConnection: any }) {
  const { user: _user, setUser } = useUser();
  const { setChainMeta } = useChainMeta();
  const { address: mxAddress } = useGetAccountInfo();
  const { isLoggedIn: isMxLoggedIn } = useGetLoginInfo();
  const [walletUsedSession] = useLocalStorage("itm-wallet-used", null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const networkId = launchEnvironment === "mainnet" ? "E1" : "ED";

    setChainMeta({
      networkId,
      contracts: contractsForChain(networkId),
      walletUsed: walletUsedSession,
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (mxAddress && isMxLoggedIn) {
      setUser({
        ...baseUserContext,
        ..._user,
        isMxAuthenticated: true,
        loggedInAddress: mxAddress,
      });
    }
  }, [mxAddress, isMxLoggedIn]);

  const resetAppContexts = () => {
    setUser({ ...baseUserContext });
    setChainMeta({});
  };

  return isLoading ? (
    <CustomLoader />
  ) : (
    <AppMx
      onLaunchMode={handleLaunchMode}
      resetAppContexts={resetAppContexts}
      appConfig={{
        mxEnvironment: launchEnvironment,
      }}
      onEVMConnection={onEVMConnection}
    />
  );
}

export default AppHarnessMx;
