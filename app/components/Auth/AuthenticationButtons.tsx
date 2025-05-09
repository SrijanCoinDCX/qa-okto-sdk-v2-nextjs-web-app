import React, { useEffect, useState } from "react";
import ModalWithOTP from "./EmailWhatsappAuth";
import GetButton from "../GetButton";

interface AuthenticationButtonsProps {
    setUserSWA: (value: string) => void;
    handleAuthenticateWebView: () => void;
    handleLoginUsingGoogle: () => void;
    setIsJWTModalOpen: (value: boolean) => void;
    isJWTModalOpen: boolean;
    handleLogout: () => void;
    isAuthenticated: boolean;
}

const AuthenticationButtons: React.FC<AuthenticationButtonsProps> = ({
    setUserSWA,
    handleAuthenticateWebView,
    handleLoginUsingGoogle,
    setIsJWTModalOpen,
    isJWTModalOpen,
    handleLogout,
    isAuthenticated,
}) => {

    return (
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8">
            {!isAuthenticated && (
                <>
                    <ModalWithOTP setUserSWA={setUserSWA} />
                    <button
                        title="Onboarding WebView"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={handleAuthenticateWebView}
                    >
                        Onboarding Webview
                    </button>
                    <button
                        title="Authenticate GAuth"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={handleLoginUsingGoogle}
                    >
                        Authenticate GAuth
                    </button>
                    <button
                        title="Authenticate with JWT"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => setIsJWTModalOpen(true)}
                    >
                        Authenticate with JWT
                    </button>
                </>
            )}
            {isAuthenticated && (
                <GetButton title="Okto Log out" apiFn={handleLogout} />
            )}
        </div>
    );
};

export default AuthenticationButtons;