"use client";
import React, { use, useEffect, useMemo, useContext, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import GetButton from "@/app/components/GetButton";
import { AppearanceOptions, getAccount, getChains, getOrdersHistory, getPortfolio, getPortfolioActivity, getPortfolioNFT, getTokens, useOkto, useOktoWebView } from '@okto_web3/react-sdk';
import Link from "next/link";
import { ConfigContext } from "@/app/components/providers";
import SignComponent from "./components/SignComponent";
import JWTAuthModal from "./components/Auth/JWTAuthentication";
import AuthenticationButtons from "./components/Auth/AuthenticationButtons";
import OrderHistoryButton from "./components/OrderHistroy/OrderHistoryComponent";
import OnboardingConfigurator, { defaultAppearanceOptions } from "./components/OnboardingConfigSetter";
import UserOp from "./components/UserOp/UserOp";
import UserOpEstimation from "./components/UserOpWithEstimation/UserOpWithEstimation";
import ConfigDetailsAndSetUp, { ConfigContextType } from "./components/ConfigDetails/ConfigDetailsAndSetUp";
import ReadContractComponent from "./components/RawRead/ReadContractComponent";

export default function Home() {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const { config, setConfig } = useContext<ConfigContextType>(ConfigContext);
  const [userSWA, setUserSWA] = useState("not signed in");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingThemeConfig, setOnboardingThemeConfig] = useState<AppearanceOptions>(() => {
    // Load from localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('okto-onboarding-config') : null;
    return saved ? JSON.parse(saved) : defaultAppearanceOptions;
  });
  const [enableEstimation, setEnableEstimation] = useState(true);


  const [isJWTModalOpen, setIsJWTModalOpen] = useState(false);

  //@ts-ignore
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);

  const handleAuthenticate = useCallback(async (): Promise<any> => {
    if (!idToken) {
      return { result: false, error: "No google login" };
    }
    const user = await oktoClient.loginUsingOAuth(
      {
        idToken: idToken,
        provider: "google",
      },
      (session: any) => {
        // Store the session info securely
        console.log("session", session);
        localStorage.setItem("okto_session", JSON.stringify(session));
        setUserSWA(session.userSWA);
      }
    );
    console.log("authenticated", user);
    setIsAuthenticated(true);
    return JSON.stringify(user);
  }, [idToken, oktoClient]);

  async function handleLogout() {
    try {
      oktoClient.sessionClear();
      signOut();
      setIsAuthenticated(false);
      return { result: "logout success" };
    } catch (error) {
      return { result: "logout failed" };
    }
  }

  useEffect(() => {
    const session = localStorage.getItem("okto_session");
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        if (parsedSession?.userSWA) {
          setUserSWA(parsedSession.userSWA);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to parse session from localStorage", e);
      }
    }
    localStorage.setItem('okto-onboarding-config', JSON.stringify(onboardingThemeConfig));

    // Check and set enableEstimation from localStorage
    const savedEstimation = localStorage.getItem('okto-enable-estimation');
    if (savedEstimation !== null) {
      setEnableEstimation(savedEstimation === 'true');
    }

    if (idToken) {
      handleAuthenticate();
    }
  }, [handleAuthenticate, idToken, onboardingThemeConfig]);

  const getSessionInfo = async () => {
    const session = localStorage.getItem("okto_session");
    console.log("Session info:", session);
    const sessionInfo = JSON.parse(session || "{}");
    return { result: sessionInfo };
  };

  async function handleWebViewAuthentication() {
    console.log("Web-view triggered..");
    try {
      // Use the latest state directly instead of relying on closure value
      const currentConfig = { ...onboardingThemeConfig };
      console.log("WebView config:", currentConfig);
      const result = await oktoClient.authenticateWithWebView({
        onSuccess: (response: any) => {
          console.log("WebView response:", response);
          if (response != undefined && response != null) {
            const { userSWA } = response;
            setUserSWA(userSWA);
            setIsAuthenticated(true);
          }
        },
        onError: (error: any) => {
          console.error('WebView error: ', error);
        },
        onClose: () => {
          console.log('WebView closed');
        }
      }, currentConfig
      );
      console.log('Authentication result:', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  const { isModalOpen, authenticate } = useOktoWebView();

  const handleAuthenticateWebView = async () => {
    const result = await authenticate(
      {
        onSuccess: (response: any) => {
          console.log("WebView response:", response);

          const { userSWA } = response;
          setUserSWA(userSWA);
          setIsAuthenticated(true);

        },
        onError: (error: any) => {
          console.error('WebView error: ', error);
        },
        onClose: () => {
          console.log('WebView closed');
        }
      }
    );
  };

  async function handleLoginUsingGoogle() {
    const result = await oktoClient.loginUsingSocial('google');
    console.log("Google login result:", result);
    if (typeof result === "string" && result) {
      setUserSWA(result);
      setIsAuthenticated(true);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center space-y-6 p-12 bg-violet-200">
      <ConfigDetailsAndSetUp userSWA={userSWA} config={config} setConfig={setConfig} />
      <div className="w-full max-w-lg rounded-lg flex items-center space-x-4">
        <h1 className="text-lg font-bold">Authentication</h1>
        <div
          className={` py-1 px-4 rounded-full text-sm text-white ${isAuthenticated ? "bg-green-500" : "bg-red-500"
            }`}
          title={isAuthenticated ? "Active" : "Inactive"}
        >{isAuthenticated ? "User Active" : "User not Active"}</div>
      </div>

      {!isAuthenticated && (
        <OnboardingConfigurator
          themeConfig={onboardingThemeConfig}
          setThemeConfig={setOnboardingThemeConfig}
        />
      )}
      <AuthenticationButtons
        setUserSWA={setUserSWA}
        handleAuthenticateWebView={handleWebViewAuthentication}
        handleLoginUsingGoogle={handleLoginUsingGoogle}
        setIsJWTModalOpen={setIsJWTModalOpen}
        isJWTModalOpen={isJWTModalOpen}
        handleLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
      <JWTAuthModal
        isOpen={isJWTModalOpen}
        onClose={() => setIsJWTModalOpen(false)}
        setUserSWA={setUserSWA}
        setIsAuthenticated={setIsAuthenticated}
      />
      <div className="w-full max-w-lg rounded-lg">
        <h1 className="text-lg font-bold">BFF Calls</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8">
        {/* <LoginButton /> */}
        {/* <GetButton title="Okto Authenticate" apiFn={handleAuthenticate} /> */}
        <GetButton title="Show Session Info" apiFn={getSessionInfo} />
        <GetButton title="getAccount" apiFn={getAccount} />
        <GetButton title="getChains" apiFn={getChains} />
        <GetButton title="getOrdersHistory" apiFn={getOrdersHistory} />
        <GetButton title="getPortfolio" apiFn={getPortfolio} />
        <GetButton title="getPortfolioActivity" apiFn={getPortfolioActivity} />
        <GetButton title="getPortfolioNFT" apiFn={getPortfolioNFT} />
        <GetButton title="getTokens" apiFn={getTokens} />
      </div>

      <div className="grid gap-4 w-full max-w-lg mt-8">
        <div className="w-full rounded-lg flex items-center space-x-4">
          <SignComponent />
          <ReadContractComponent />
        </div>
        <OrderHistoryButton />
      </div>

      <div className="w-full max-w-lg rounded-lg flex items-center justify-between space-x-4 mt-8">
        <h1 className="text-lg font-bold">User Operations</h1>
        <div className="flex items-center space-x-2">
          <label htmlFor="enableEstimation" className="text-sm font-medium text-gray-700 flex items-center">
            <input
              id="enableEstimation"
              type="checkbox"
              checked={enableEstimation}
              onChange={(e) => {
                setEnableEstimation(e.target.checked);
                localStorage.setItem('okto-enable-estimation', e.target.checked.toString());
              }}
              className="toggle-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 ml-2"
            />
            <span className="ml-2">Enable Estimation</span>
          </label>
        </div>
      </div>
      {!enableEstimation ? <UserOp /> : <UserOpEstimation />}

      <div className="flex flex-row space-x-2 w-full max-w-lg mt-8">
        <Link
          href="/pages/swap"
          className="w-full h-24 px-8 py-3 bg-gradient-to-r from-purple-300 via-blue-500 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:via-blue-600 hover:to-purple-700 transition-all text-center flex items-center justify-center shadow-lg transform hover:scale-102"
        >
          Swap Tokens
        </Link>
      </div>
    </main>
  );
}

