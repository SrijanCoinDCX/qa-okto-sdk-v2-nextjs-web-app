import { OnrampOptions } from '@okto_web3/react-sdk';
import React, { useState } from 'react';

interface Token {
    tokenId: string;
    name: string;
    shortName: string;
    logo?: string;
}

interface SupportedTokenListProps {
    showPopup: boolean;
    setShowPopup: (show: boolean) => void;
    tokens: Token[];
    loading: boolean;
    handleSelectToken: (tokenId: string) => void;
    onrampOptions: OnrampOptions;
    setOnRampOptions: (options: OnrampOptions) => void;
    refetchTokens: (countryCode?: string) => void;
}

export default function SupportedTokenList({
    showPopup,
    setShowPopup,
    tokens,
    loading,
    handleSelectToken,
    onrampOptions,
    setOnRampOptions,
    refetchTokens
}: SupportedTokenListProps) {
    const [showAppearance, setShowAppearance] = useState(false);
    const [tempOptions, setTempOptions] = useState<OnrampOptions>(onrampOptions);

    const countries = [
        { code: "IN", name: "India" },
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "AU", name: "Australia" },
        { code: "DE", name: "Germany" },
        { code: "FR", name: "France" },
        { code: "JP", name: "Japan" },
    ];

    const updateTempOptions = (key: keyof OnrampOptions, value: string) => {
        setTempOptions({
            ...tempOptions,
            [key]: value
        });
    };

    const openAppearanceOptions = () => {
        setTempOptions(onrampOptions);
        setShowAppearance(true);
    };

    const saveAndCloseAppearance = () => {
        setOnRampOptions(tempOptions);
        setShowAppearance(false);
        // Pass the new country code to refetchTokens immediately
        refetchTokens(tempOptions.countryCode);
    };

    const cancelAppearanceOptions = () => {
        setTempOptions(onrampOptions);
        setShowAppearance(false);
    };

    return (
        <>
            {showPopup && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="blockchain-grid"></div>
                    </div>
                    
                    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-scale-in backdrop-blur-xl">
                        <div className="absolute -inset-1 bg-blue-500/10 rounded-2xl blur-xl opacity-50"></div>
                        
                        <div className="relative flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                                    <div className="w-4 h-4 border-2 border-white rounded-sm animate-pulse"></div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
                                    SELECT TOKEN
                                </h2>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={openAppearanceOptions}
                                    className="group w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-blue-50 hover:border-blue-400/60 transition-all duration-300 shadow-lg"
                                    title="Appearance Options"
                                >
                                    <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setShowPopup(false)}
                                    className="group w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 hover:border-red-400/60 transition-all duration-300 shadow-lg"
                                >
                                    <span className="text-gray-600 group-hover:text-red-500 font-bold text-lg">✕</span>
                                </button>
                            </div>
                        </div>

                        {showAppearance && (
                            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-slide-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                                        </svg>
                                        <span>Appearance Settings</span>
                                    </h3>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Theme Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                        <div className="flex space-x-3">
                                            {['light', 'dark'].map((theme) => (
                                                <button
                                                    key={theme}
                                                    onClick={() => updateTempOptions('theme', theme as 'light' | 'dark')}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2 ${
                                                        tempOptions.theme === theme
                                                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Country Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                        <select
                                            value={tempOptions.countryCode}
                                            onChange={(e) => updateTempOptions('countryCode', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all duration-300"
                                        >
                                            {countries.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* App Version */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">App Version</label>
                                        <input
                                            type="text"
                                            value={tempOptions.appVersion}
                                            onChange={(e) => updateTempOptions('appVersion', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed transition-all duration-300"
                                            placeholder="e.g., 1.0.0"
                                            disabled
                                        />
                                    </div>

                                    {/* Screen Source */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Screen Source</label>
                                        <input
                                            type="text"
                                            value={tempOptions.screenSource}
                                            onChange={(e) => updateTempOptions('screenSource', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed transition-all duration-300"
                                            placeholder="e.g., AddFundsScreen"
                                            disabled
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={cancelAppearanceOptions}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveAndCloseAppearance}
                                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                        Save & Apply
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {!showAppearance && (
                            <>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                                            <div className="absolute top-2 left-2 w-12 h-12 border-2 border-transparent border-t-blue-400 rounded-full animate-spin animate-reverse"></div>
                                        </div>
                                        <div className="text-gray-700 font-semibold text-lg animate-pulse">
                                            Fetching tokens...
                                        </div>
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-lg"></div>
                                            <div
                                                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce shadow-lg"
                                                style={{ animationDelay: '0.1s' }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-blue-300 rounded-full animate-bounce shadow-lg"
                                                style={{ animationDelay: '0.2s' }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Select a token to proceed with the onramp process.
                                            </p>
                                        </div>
                                        {tokens.map((token, index) => (
                                            <div
                                                key={token.tokenId}
                                                onClick={() => handleSelectToken(token.tokenId)}
                                                className="group relative p-5 rounded-xl bg-gray-50/80 border border-gray-200 hover:border-blue-400/60 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/15 transform hover:scale-[1.02] animate-slide-in backdrop-blur-sm"
                                                style={{ animationDelay: `${index * 0.08}s` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 to-blue-600/8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center space-x-4">
                                                    <div className="relative flex-shrink-0">
                                                        {token.logo ? (
                                                            <div className="relative">
                                                                <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                                <img
                                                                    src={token.logo}
                                                                    alt={token.name}
                                                                    className="relative w-12 h-12 rounded-full border-2 border-gray-300 group-hover:border-blue-400/60 transition-all duration-300 shadow-lg"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-300 group-hover:border-blue-400/60 flex items-center justify-center shadow-lg transition-all duration-300">
                                                                <span className="text-gray-700 font-bold text-lg">
                                                                    {token.shortName.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 text-lg">
                                                            {token.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 font-mono tracking-wide">
                                                            {token.shortName}
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-blue-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-xl">
                                                        →
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <style jsx>{`
                        @keyframes fade-in {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scale-in {
                            from { 
                                opacity: 0; 
                                transform: scale(0.9) translateY(20px); 
                            }
                            to { 
                                opacity: 1; 
                                transform: scale(1) translateY(0); 
                            }
                        }
                        @keyframes slide-in {
                            from { 
                                opacity: 0; 
                                transform: translateX(-20px); 
                            }
                            to { 
                                opacity: 1; 
                                transform: translateX(0); 
                            }
                        }
                        .animate-fade-in {
                            animation: fade-in 0.4s ease-out;
                        }
                        .animate-scale-in {
                            animation: scale-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                        .animate-slide-in {
                            animation: slide-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                            opacity: 0;
                        }
                        .animate-reverse {
                            animation-direction: reverse;
                        }
                        .blockchain-grid {
                            position: absolute;
                            top: 0;
                            left: 0;
            right: 0;
                            bottom: 0;
                            background-image: 
                                linear-gradient(rgba(59, 130, 246, 0.12) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
                                radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
                            background-size: 30px 30px, 30px 30px, 200px 200px;
                            animation: grid-flow 30s linear infinite;
                        }
                        @keyframes grid-flow {
                            0% { transform: translate(0, 0) rotate(0deg); }
                            100% { transform: translate(30px, 30px) rotate(360deg); }
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: rgba(229, 231, 235, 0.5);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: linear-gradient(to bottom, #3b82f6, #1e40af);
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: linear-gradient(to bottom, #60a5fa, #3b82f6);
                            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}