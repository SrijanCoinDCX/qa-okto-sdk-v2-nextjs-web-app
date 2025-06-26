"use client";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import {
    useOkto,
    getPortfolioForSwap,
} from "@okto_web3/react-sdk";

interface PortfolioData {
    aggregatedData: {
        holdingsCount: string;
        totalHoldingPriceInr: string;
        totalHoldingPriceUsdt: string;
    };
    groupTokens: Array<{
        tokens: Array<{
            id: string;
            name: string;
            symbol: string;
            tokenImage?: string;
            precision?: string;
            balance: string;
            viewBalance: string;
            holdingsPriceInr: string;
        }>;
    }>;
}

const PortfolioCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioData>({
        aggregatedData: {
            holdingsCount: "0",
            totalHoldingPriceInr: "0",
            totalHoldingPriceUsdt: "0",
        },
        groupTokens: [],
    });

    const oktoClient = useOkto();

    useEffect(() => {
        loadPortfolio();
    }, [oktoClient]);

    const loadPortfolio = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getPortfolioForSwap(oktoClient);
            setPortfolio(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError("Failed to load portfolio");
            console.error("Portfolio loading error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshPortfolio = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setIsRefreshing(true);
        setError(null);
        try {
            const data = await getPortfolioForSwap(oktoClient);
            setPortfolio(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError("Failed to refresh portfolio");
            console.error("Portfolio refresh error:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <>
            {/* Portfolio Card */}
            <div
                className="w-96 mx-auto mt-6 bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-blue-400/30 backdrop-blur-sm relative overflow-hidden group"
                onClick={() => setIsModalOpen(true)}
            >
                {/* Blockchain-style animated background */}
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] group-hover:opacity-20 transition-opacity duration-300"></div>

                {/* Animated glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700"></div>

                {/* Refresh button */}
                <button
                    onClick={refreshPortfolio}
                    className={`absolute top-2 right-2 p-2 rounded-full bg-blue-800/50 hover:bg-blue-700/70 border border-blue-400/30 transition-all duration-300 z-20 group-hover:opacity-100 ${isRefreshing ? 'opacity-100' : 'opacity-70'}`}
                    title="Refresh portfolio data"
                    disabled={isRefreshing}
                >
                    <svg
                        className={`w-4 h-4 text-blue-200 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>

                <div className="flex justify-between items-center relative z-10">
                    {isLoading ? (
                        <div className="w-full flex justify-center items-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-300"></div>
                        </div>
                    ) : error ? (
                        <div className="w-full text-center">
                            <p className="text-sm text-red-300">{error}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); loadPortfolio(); }}
                                className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md text-xs text-white transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 22L3 17V7L12 2L21 7V17L12 22ZM12 4L5 8V16L12 20L19 16V8L12 4Z" />
                                        <path d="M12 11L19 7L12 3L5 7L12 11Z" />
                                        <path d="M12 22V16" />
                                        <path d="M21 12L12 16L3 12" />
                                    </svg>
                                    Portfolio Summary
                                </h3>
                                <div className="flex items-center mt-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse m-2"></div>
                                    <p className="text-sm text-blue-200">{portfolio.aggregatedData.holdingsCount} assets</p>
                                </div>
                            </div>
                            <div className="text-right bg-blue-900/50 p-3 rounded-lg backdrop-blur-sm border border-blue-400/20">
                                <p className="text-lg font-medium text-white">
                                    ₹{parseFloat(portfolio.aggregatedData.totalHoldingPriceInr).toFixed(2)}
                                </p>
                                <p className="text-sm text-blue-300">
                                    ${parseFloat(portfolio.aggregatedData.totalHoldingPriceUsdt).toFixed(2)}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Portfolio Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Portfolio Details">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-center mt-4 text-gray-600">Syncing blockchain data...</p>
                    </div>
                ) : isRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-center mt-4 text-gray-600">Refreshing portfolio data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-500 font-medium">{error}</p>
                        <button
                            onClick={loadPortfolio}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
                        {/* Header with refresh button */}
                        <div className="sticky top-0 z-20 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-500">
                                    {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Not yet updated'}
                                </span>
                            </div>
                            <button
                                onClick={refreshPortfolio}
                                disabled={isRefreshing}
                                className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg
                                    className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {/* Aggregated Data */}
                        <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg p-6 mb-6 shadow-md relative overflow-hidden">
                            {/* Background effect */}
                            <div className="absolute inset-0 bg-[url('/blockchain-grid.svg')] opacity-10"></div>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="bg-blue-800/50 p-4 rounded-lg backdrop-blur-sm border border-blue-400/20">
                                    <p className="text-sm text-blue-200 uppercase tracking-wider">Total Value</p>
                                    <p className="text-2xl font-bold mt-1">
                                        ₹{parseFloat(portfolio.aggregatedData.totalHoldingPriceInr).toLocaleString('en-IN', {
                                            maximumFractionDigits: 2,
                                            minimumFractionDigits: 2
                                        })}
                                    </p>
                                    <p className="text-sm text-blue-300 mt-1">
                                        ${parseFloat(portfolio.aggregatedData.totalHoldingPriceUsdt).toLocaleString('en-US', {
                                            maximumFractionDigits: 2,
                                            minimumFractionDigits: 2
                                        })}
                                    </p>
                                </div>
                                <div className="bg-purple-800/50 p-4 rounded-lg backdrop-blur-sm border border-purple-400/20">
                                    <p className="text-sm text-purple-200 uppercase tracking-wider">Total Assets</p>
                                    <div className="flex items-center">
                                        <p className="text-2xl font-bold">{portfolio.aggregatedData.holdingsCount}</p>
                                        <svg className="ml-2 w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Token List */}
                        <div className="px-4 pb-6 space-y-4">
                            <h4 className="font-bold text-gray-800 text-lg flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 116 0v2h2V7a5 5 0 00-5-5z" />
                                </svg>
                                Assets
                            </h4>

                            {portfolio.groupTokens.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500">No assets found in your portfolio</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {portfolio.groupTokens.map((group, groupIndex) => (
                                        <div key={`group-${groupIndex}`} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                                            {/* Group Header */}
                                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-blue-100 rounded-lg p-2">
                                                            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-800">Token Group {groupIndex + 1}</h3>
                                                            <p className="text-sm text-gray-500">{group.tokens.length} tokens</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tokens List */}
                                            <div className="divide-y divide-gray-100">
                                                {group.tokens?.map((token, tokenIndex) => (
                                                    <div
                                                        key={`${groupIndex}-${tokenIndex}-${token.id}`}
                                                        className="p-4 hover:bg-gray-50 transition-colors duration-200"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            {/* Token Info */}
                                                            <div className="flex items-center space-x-4">
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                                                                    <img
                                                                        src={token.tokenImage || "/token-placeholder.png"}
                                                                        alt={token.name}
                                                                        className="w-12 h-12 rounded-full relative z-10 border-2 border-white shadow-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <h4 className="font-bold text-gray-800">{token.symbol}</h4>
                                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                            {token.symbol}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">{token.name}</p>
                                                                    {token.id && (
                                                                        <p className="text-xs text-gray-400 font-mono mt-1">
                                                                            {token.id.slice(0, 6)}...{token.id.slice(-4)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Balance Info */}
                                                            <div className="text-right">
                                                                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                                                    <p className="font-mono text-lg font-medium text-gray-800">
                                                                        {Number(token.viewBalance).toLocaleString(undefined, {
                                                                            maximumFractionDigits: 8
                                                                        })} {token.symbol}
                                                                    </p>
                                                                    <p className="text-sm font-medium text-gray-400">
                                                                        Raw Balance: {token.balance}
                                                                    </p>
                                                                    <p className="text-sm font-medium text-gray-600">
                                                                        ₹{parseFloat(token.holdingsPriceInr).toLocaleString('en-IN', {
                                                                            maximumFractionDigits: 2,
                                                                            minimumFractionDigits: 2
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default PortfolioCard;