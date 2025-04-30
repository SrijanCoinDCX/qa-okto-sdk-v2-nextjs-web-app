"use client";
import React, { useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";

interface JWTAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  setUserSWA: (swa: string) => void;
}

export default function JWTAuthModal({ isOpen, onClose, setUserSWA }: JWTAuthModalProps) {
  const [jwtToken, setJwtToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const oktoClient = useOkto();

  async function handleJWTAuthentication() {
    setLoading(true);
    setErrorMessage(""); // Reset error before new attempt
    try {
      const result = await oktoClient.loginUsingJWTAuthentication(jwtToken, (session) => {
        console.log("Session established:", session);
        localStorage.setItem("okto_session_info", JSON.stringify(session));
        setUserSWA(session.userSWA);
      });
      console.log("Authentication result:", result);
      onClose();
    } catch (error: any) {
      console.error("Authentication failed:", error);
      setErrorMessage(error?.message || "Authentication failed. Please check your JWT token.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Enter JWT Token</h2>
        <textarea
          className="w-full p-2 border rounded mb-2"
          rows={4}
          value={jwtToken}
          onChange={(e) => setJwtToken(e.target.value)}
          placeholder="Paste your JWT token here"
          disabled={loading}
        />
        {errorMessage && (
          <p className="text-red-600 text-sm mb-2">{errorMessage}</p>
        )}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleJWTAuthentication}
            className={`px-4 py-2 rounded text-white ${loading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
              }`}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </div>
      </div>
    </div>
  );
}
