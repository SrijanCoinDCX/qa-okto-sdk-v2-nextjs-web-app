"use client";
import React, { use, useEffect, useMemo, useContext, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LoginButton } from "@/app/components/Auth/LoginButton";
import GetButton from "@/app/components/GetButton";
import { getAccount, getChains, getOrdersHistory, getPortfolio, getPortfolioActivity, getPortfolioNFT, getTokens, useOkto, useOktoWebView } from '@okto_web3/react-sdk';
import Link from "next/link";
import { ConfigContext } from "@/app/components/providers";
import { STORAGE_KEY } from "./constants";
import SignComponent from "./components/SignComponent";
import ModalWithOTP from "./components/Auth/EmailWhatsappAuth";
import JWTAuthModal from "./components/Auth/JWTAuthentication";
import AuthenticationButtons from "./components/Auth/AuthenticationButtons";
import OrderHistoryButton from "./components/Swap/OrderHistoryComponent";


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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    setIsAuthenticated(true);
    return JSON.stringify(user);
  }

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
      });
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
      <div className="w-full max-w-lg rounded-lg flex items-center space-x-4">
        <h1 className="text-lg font-bold">Authentication</h1>
        <div
          className={` py-1 px-4 rounded-full text-sm text-white ${isAuthenticated ? "bg-green-500" : "bg-red-500"
            }`}
          title={isAuthenticated ? "Active" : "Inactive"}
        >{isAuthenticated ? "User Active" : "User not Active"}</div>
      </div>
      <AuthenticationButtons
        setUserSWA={setUserSWA}
        handleAuthenticateWebView={handleAuthenticateWebView}
        handleLoginUsingGoogle={handleLoginUsingGoogle}
        setIsJWTModalOpen={setIsJWTModalOpen}
        isJWTModalOpen={isJWTModalOpen}
        handleLogout={handleLogout}
        isAuthenticated={isAuthenticated}
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
        <SignComponent />
        <OrderHistoryButton />
      </div>

      <div className="w-full max-w-lg rounded-lg">
        <h1 className="text-lg font-bold">User Operations</h1>
      </div>

      <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md flex flex-row space-x-2">
        <Link
          href="/pages/transfer"
          className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
        >
          Transfer Token
        </Link>
        <div className="w-px bg-gray-300 mx-4"></div>
        <Link
          href="/pages/createnft"
          className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
        >
          NFT Collection Creation
        </Link>
        <div className="w-px bg-gray-300 mx-4"></div>
        <Link
          href="/pages/transfernft"
          className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
        >
          NFT Transfer
        </Link>
        <div className="w-px bg-gray-300 mx-4"></div>
        <Link
          href="/pages/nftmint"
          className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
        >
          NFT Mint
        </Link>
      </div>

      <div className="flex flex-row space-x-2 w-full max-w-lg mt-8">
        <Link
          href="/pages/evmrawtxn"
          className="flex-1 h-24 w-58 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center flex items-center justify-center"
        >
          EVM Raw transaction
        </Link>
        <Link
          href="/pages/aptosrawtxn"
          className="flex-1 h-24 w-58 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center flex items-center justify-center"
        >
          APTOS Raw transaction
        </Link>
      </div>
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

