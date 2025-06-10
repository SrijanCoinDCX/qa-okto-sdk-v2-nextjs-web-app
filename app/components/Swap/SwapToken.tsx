/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
    useOkto,
    getTokensForSwap,
    getPortfolio,
    TokenEntity,
    TokenListingFilter,
    EstimationDetails,
} from "@okto_web3/react-sdk";
import { swapToken } from "@okto_web3/react-sdk/userop";
import { ArrowPathIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/Swap/Modal";
import TokenList from "@/app/components/Swap/TokenList";
import { ArrowUpDownIcon } from "lucide-react";
import { UserOp } from "@/types/swap";
import SwapDetailsComponent from "./SwapDetailsComponent";
import { AxiosError } from "axios";


interface SwapEstimateResult {
    userOp: UserOp;
    details: EstimationDetails;
}

interface ExecutionResult {
    success: boolean;
    jobId?: string;
    error?: string;
}

export default function SwapTokensPage() {
    const oktoClient = useOkto();
    const [fromToken, setFromToken] = useState<TokenEntity | null>(null);
    const [toToken, setToToken] = useState<TokenEntity | null>(null);
    const [amount, setAmount] = useState("");
    const [showTokenModal, setShowTokenModal] = useState<"from" | "to" | null>(null);
    const [tokens, setTokens] = useState<TokenEntity[]>([]);
    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [swapEstimate, setSwapEstimate] = useState<SwapEstimateResult>();
    const [showDetails, setShowDetails] = useState(false);
    const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
    const [feePayerAddress, setFeePayerAddress] = useState<`0x${string}` | undefined>(undefined);

    const loadPortfolio = async () => {
        try {
            const data = await getPortfolio(oktoClient);
            setPortfolio(data);
        } catch (err) {
            setError("Failed to load portfolio");
        }
    };

    const convertAmountWithPrecision = (amount: string, decimals: number): string => {
        try {
            const [integerPart, fractionalPart = ''] = amount.split('.');
            const paddedFraction = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
            return BigInt(`${integerPart}${paddedFraction}`).toString();
        } catch (error) {
            console.error('Error converting amount:', error);
            return '0';
        }
    };

    const formattedOutputAmount = (outputAmount: string, decimals: number): string => {
        try {
            const divisor = BigInt(10 ** decimals);
            const amount = BigInt(outputAmount);
            const whole = amount / divisor;
            const fractional = amount % divisor;
            return `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`.replace(/\.$/, '');
        } catch (error) {
            console.error('Error formatting output:', error);
            return '0.0';
        }
    };

    useEffect(() => {
        loadPortfolio();
    }, [oktoClient]);

    const loadTokens = async (filter: TokenListingFilter) => {
        try {
            setLoading(true);
            const tokenList = await getTokensForSwap(oktoClient, filter);
            setTokens(tokenList);
        } catch (err) {
            setError("Failed to load tokens");
        } finally {
            setLoading(false);
        }
    };

    const handleTokenSelect = (type: "from" | "to") => {
        setShowTokenModal(type);
        setError("");
        loadTokens({ type: "discovery" });
    };

    const switchTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
    };

    const getBalance = (token: TokenEntity) => {
        if (!portfolio?.groupTokens) return "0";
        return portfolio.groupTokens.find(
            (t: any) => t.tokenAddress === token.details.address
        )?.balance || "0";
    };

    const handleSwap = async () => {
        if (!fromToken || !toToken || !amount) {
            setError("Please select tokens and enter amount");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const fromDecimals = fromToken.details.decimals ? parseInt(fromToken.details.decimals) : 18;
            const formattedAmount = convertAmountWithPrecision(amount, fromDecimals);

            const data = {
                fromChainTokenAddress: fromToken.details.address,
                fromChainCaip2Id: `eip155:${fromToken.details.chainId}`,
                toChainTokenAddress: toToken.details.address,
                toChainCaip2Id: `eip155:${toToken.details.chainId}`,
                fromChainTokenAmount: formattedAmount,
                minToTokenAmount: "0",
                slippage: "2",
                sameChainFee: "10",
                sameChainFeeCollector: "0x2c2505D0E21f32F38bCEBeca1C331ab4069bBCb9",
                crossChainFee: "10",
                crossChainFeeCollector: "0x2c2505D0E21f32F38bCEBeca1C331ab4069bBCb9",
                advancedSettings: {},
            };

            const result = await swapToken(oktoClient, data, feePayerAddress);
            setSwapEstimate(result);
            setShowDetails(true);
            setLoading(false);
        } catch (err) {
            console.error("Swap error:", err);
            const errorResponse = (err as AxiosError).request?.responseText || "Unknown error";
            try {
                const parsedError = JSON.parse(errorResponse);
                setError(parsedError.error?.details || "Swap estimation failed");
            } catch (parseError) {
                setError("Swap estimation failed: " + errorResponse);
            }
            setLoading(false);
        }
    };

    const SuccessModal = ({
        isOpen,
        onClose,
        jobId
    }: {
        isOpen: boolean;
        onClose: () => void;
        jobId?: string
    }) => {
        const [copied, setCopied] = useState(false);

        const copyToClipboard = () => {
            if (jobId) {
                navigator.clipboard.writeText(jobId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Swap Successful">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Transaction Submitted Successfully!
                        </h3>
                        <p className="text-gray-600">Your swap is being processed on the blockchain.</p>
                    </div>
                    
                    {jobId && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-mono text-gray-700 truncate flex-1 mr-2">
                                    {jobId}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                >
                                    {copied ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={onClose}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        );
    };

    const executeSwap = async () => {
        if (!swapEstimate) return;

        try {
            setLoading(true);
            const signedUserOp = await oktoClient.signUserOp(swapEstimate.userOp);
            const jobId = await oktoClient.executeUserOp(signedUserOp);

            setExecutionResult({
                success: true,
                jobId,
            });

            setShowDetails(false);
            setAmount("");
            loadPortfolio();
        } catch (err: any) {
            console.error("Error executing swap:", err);
            setError(err.message || "Failed to execute swap. Please try again.");
            setExecutionResult({
                success: false,
                error: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-4 md:p-8">
            <div className="max-w-md mx-auto">
                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-white">Swap Tokens</h1>
                            <button
                                onClick={() => loadPortfolio()}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowPathIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* From Token Section */}
                        <div className="relative">
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-600">From</span>
                                    <span className="text-sm text-gray-500">
                                        Balance: {fromToken ? getBalance(fromToken) : "0"}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="bg-transparent text-3xl font-semibold placeholder-gray-300 w-full mr-4 focus:outline-none"
                                    />
                                    
                                    <button
                                        onClick={() => handleTokenSelect("from")}
                                        className="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 min-w-0 flex-shrink-0"
                                    >
                                        {fromToken ? (
                                            <>
                                                <img
                                                    src={fromToken.details.logo || "/token-placeholder.png"}
                                                    alt={fromToken.details.symbol}
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full mr-2"
                                                />
                                                <span className="font-semibold text-gray-900 mr-2">
                                                    {fromToken.details.symbol}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="font-semibold text-gray-600 mr-2">Select</span>
                                        )}
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Switch Button */}
                            <div className="flex justify-center -my-3 relative z-10">
                                <button
                                    onClick={switchTokens}
                                    className="bg-white p-3 rounded-full shadow-lg border-2 border-gray-100 hover:border-violet-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <ArrowUpDownIcon className="w-5 h-5 text-violet-600 transform transition-transform duration-300 hover:rotate-180" />
                                </button>
                            </div>
                        </div>

                        {/* To Token Section */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mt-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-600">To</span>
                                <span className="text-sm text-gray-500">
                                    Balance: {toToken ? getBalance(toToken) : "0"}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-semibold text-gray-900 flex-1 mr-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {swapEstimate?.details?.estimation?.outputAmount
                                        ? formattedOutputAmount(
                                            swapEstimate.details.estimation.outputAmount,
                                            toToken?.details.decimals ? parseInt(toToken.details.decimals) : 18
                                        )
                                        : "0.0"}
                                </div>
                                
                                <button
                                    onClick={() => handleTokenSelect("to")}
                                    className="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 min-w-0 flex-shrink-0"
                                >
                                    {toToken ? (
                                        <>
                                            <img
                                                src={toToken.details.logo || "/token-placeholder.png"}
                                                alt={toToken.details.symbol}
                                                width={24}
                                                height={24}
                                                className="rounded-full mr-2"
                                            />
                                            <span className="font-semibold text-gray-900 mr-2">
                                                {toToken.details.symbol}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="font-semibold text-gray-600 mr-2">Select</span>
                                    )}
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Fee Payer Address */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fee Payer Address (Optional)
                            </label>
                            <input
                                type="text"
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 focus:outline-none transition-all"
                                value={feePayerAddress || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.startsWith("0x")) {
                                        setFeePayerAddress(value as `0x${string}`);
                                    } else {
                                        setFeePayerAddress(undefined);
                                    }
                                }}
                                placeholder="Enter fee payer address for sponsored transactions"
                            />
                        </div>

                        {/* Swap Button */}
                        <button
                            onClick={handleSwap}
                            disabled={!fromToken || !toToken || !amount || loading}
                            className="w-full mt-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                "Swap Now"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Token Selection Modal */}
            <Modal
                isOpen={!!showTokenModal}
                onClose={() => setShowTokenModal(null)}
                title={`Select ${showTokenModal === "from" ? "From" : "To"} Token`}
            >
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 focus:outline-none transition-all"
                        onChange={(e) => loadTokens({ type: "search", searchText: e.target.value })}
                    />
                </div>

                <TokenList
                    tokens={tokens}
                    portfolio={portfolio}
                    onSelect={(token) => {
                        showTokenModal === "from" ? setFromToken(token) : setToToken(token);
                        setShowTokenModal(null);
                    }}
                    loading={loading}
                />
            </Modal>

            {/* Swap Details Modal */}
            <Modal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                title="Review Swap"
            >
                <SwapDetailsComponent
                    details={swapEstimate?.details}
                    fromAmount={amount}
                    fromToken={fromToken}
                    toToken={toToken}
                    formattedOutputAmount={swapEstimate?.details?.estimation?.outputAmount || "0.0"}
                />

                <div className="flex space-x-3 mt-6">
                    <button
                        onClick={() => setShowDetails(false)}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={executeSwap}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Confirming...</span>
                            </div>
                        ) : (
                            "Confirm Swap"
                        )}
                    </button>
                </div>
            </Modal>
            {/* Success Modal */}
            <SuccessModal
                isOpen={!!executionResult?.success}
                onClose={() => {
                    setExecutionResult(null);
                    setShowDetails(false);
                    setFromToken(null);
                    setToToken(null);
                    setSwapEstimate(undefined);
                    setAmount("");
                    setError("");
                }}
                jobId={executionResult?.jobId}
            />
        </main>
    );
}