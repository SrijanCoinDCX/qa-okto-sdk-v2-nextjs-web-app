"use client";
import React, { use, useEffect, useMemo, useContext, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LoginButton } from "@/app/components/LoginButton";
import GetButton from "@/app/components/GetButton";
import { getAccount, getChains, getOrdersHistory, getPortfolio, getPortfolioActivity, getPortfolioNFT, getTokens, useOkto, useOktoWebView } from '@okto_web3/react-sdk';
import Link from "next/link";
import { ConfigContext } from "@/app/components/providers";
import { STORAGE_KEY } from "./constants";
import SignComponent from "./components/SignComponent";
import ModalWithOTP from "./components/EmailWhatsappAuth";
import JWTAuthModal from "./components/JWTAuthentication";

// Add type definitions
interface Config {
  environment: string;
  clientPrivateKey: string;
  clientSWA: string;
}

interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export default function Home() {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const { config, setConfig } = useContext<ConfigContextType>(ConfigContext);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [userSWA, setUserSWA] = useState("not signed in");

  const [isJWTModalOpen, setIsJWTModalOpen] = useState(false);
  const [jwtTokenInput, setJwtTokenInput] = useState("");

  //@ts-ignore
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);

  async function handleAuthenticate(): Promise<any> {
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
        localStorage.setItem("okto_session_info", JSON.stringify(session));
        setUserSWA(session.userSWA);
      }
    );
    console.log("authenticated", user);
    return JSON.stringify(user);
  }

  async function handleLogout() {
    try {
      oktoClient.sessionClear();
      signOut();
      return { result: "logout success" };
    } catch (error) {
      return { result: "logout failed" };
    }
  }

  useEffect(() => {
    if (idToken) {
      handleAuthenticate();
    }
  }, [idToken]);

  // Update the handleConfigUpdate function
  const handleConfigUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setConfig({
      environment: (formData.get("environment") as string) || "sandbox",
      clientPrivateKey: (formData.get("clientPrivateKey") as string) || "",
      clientSWA: (formData.get("clientSWA") as string) || "",
    });
    setIsConfigOpen(false);
  };

  // Update the handleResetConfig function
  const handleResetConfig = () => {
    const defaultConfig = {
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "sandbox",
      clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY || "",
      clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA || "",
    };
    setConfig(defaultConfig);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error removing config from localStorage:", error);
    }
    setIsConfigOpen(false);
  };

  const getSessionInfo = async () => {
    const session = localStorage.getItem("okto_session_info");
    const sessionInfo = JSON.parse(session || "{}");
    return { result: sessionInfo };
  };

  async function handleWebViewAuthentication() {
    console.log("Web-view triggered..");
    try {
      const result = await oktoClient.authenticateWithWebView({
        onClose: () => {
          console.log('WebView was closed');
        }
      });
      console.log('Authentication result:', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  const { isModalOpen, authenticate } = useOktoWebView();

  const handleAuthenticateWebView = async () => {
    try {
      const result = await authenticate();
      console.log('Authentication successful:', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  async function handleLoginUsingGoogle() {
    const result = oktoClient.loginUsingSocial('google');
    console.log("Google login result:", result);
  }

  return (
    <main className="flex min-h-screen flex-col items-center space-y-6 p-12 bg-violet-200">
      <div className="text-black font-bold text-3xl mb-8">Okto v2 SDK</div>

      {/* Config Button */}
      <button
        onClick={() => setIsConfigOpen(!isConfigOpen)}
        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        {isConfigOpen ? "Close Config" : "Update Config"}
      </button>

      {/* Current Config Display */}
      {!isConfigOpen && (
        <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-medium text-gray-700 mb-2">
            Current Configuration:
          </h3>
          <div className="text-sm text-gray-600">
            <p>Environment: {config.environment}</p>
            <p>
              Client Private Key:{" "}
              {config.clientPrivateKey ? "••••••••" : "Not set"}
            </p>
            <p>Client SWA: {config.clientSWA ? "••••••••" : "Not set"}</p>
          </div>
        </div>
      )}

      {/* Config Form */}
      {isConfigOpen && (
        <form
          onSubmit={handleConfigUpdate}
          className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Environment
            </label>
            <select
              name="environment"
              defaultValue={config.environment}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="sandbox">Sandbox</option>
              <option value="staging">Staging</option>
              {/* <option value="production">Production</option> */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client Private Key
            </label>
            <input
              type="text"
              name="clientPrivateKey"
              defaultValue={config.clientPrivateKey}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client SWA
            </label>
            <input
              type="text"
              name="clientSWA"
              defaultValue={config.clientSWA}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleResetConfig}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset to Default
            </button>
          </div>
        </form>
      )}
      <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-medium text-gray-700 mb-2">Details:</h3>
        <div className="text-sm text-gray-600">
          <p>{`UserSWA: ${userSWA}`}</p>
          <p>{`ClientSWA: ${config.clientSWA}`}</p>
        </div>
      </div>
      <ModalWithOTP
        setUserSWA={setUserSWA}
      />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8">
        <GetButton title="Onboarding WebView" apiFn={handleAuthenticateWebView} checkLogin={false} />
        <GetButton title="Authenticate GAuth" apiFn={handleLoginUsingGoogle} checkLogin={false} />
        <GetButton title="Authenticate with JWT" apiFn={() => setIsJWTModalOpen(true)} checkLogin={false} />
        <JWTAuthModal
          isOpen={isJWTModalOpen}
          onClose={() => setIsJWTModalOpen(false)}
          setUserSWA={setUserSWA}
        />
        {/* <LoginButton /> */}
        {/* <GetButton title="Okto Authenticate" apiFn={handleAuthenticate} /> */}
        <GetButton title="Show Session Info" apiFn={getSessionInfo} />
        <GetButton title="Okto Log out" apiFn={handleLogout} />
        <GetButton title="getAccount" apiFn={getAccount} />
        <GetButton title="getChains" apiFn={getChains} />
        <GetButton title="getOrdersHistory" apiFn={getOrdersHistory} />
        <GetButton title="getPortfolio" apiFn={getPortfolio} />
        <GetButton title="getPortfolioActivity" apiFn={getPortfolioActivity} />
        <GetButton title="getPortfolioNFT" apiFn={getPortfolioNFT} />
        <GetButton title="getTokens" apiFn={getTokens} />
      </div>

      <div className="grid gap-4 w-full max-w-lg mt-8">
        <SignComponent />
      </div>

      <Link
        href="/transfer"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Transfer Token Page
      </Link>

      {/* <Link 
        href="/createnft" 
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Create NFT Page
      </Link> */}

      <Link
        href="/transfernft"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Transfer NFT Page
      </Link>

      <Link
        href="/evmrawtxn"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to EVM Raw transaction
      </Link>
      {/* <Link
        href="/aptosrawtxn"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to APTOS Raw transaction
      </Link> */}
    </main>
  );
}

