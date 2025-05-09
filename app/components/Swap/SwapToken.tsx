/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
    useOkto,
    getTokensForSwap,
    getPortfolio,
    TokenEntity,
    TokenListingFilter,
    SwapDetails,
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
    details: SwapDetails;
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
    const [executionResult, setExecutionResult] =
        useState<ExecutionResult | null>(null);

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
                fromChainTokenAmount: formattedAmount, // Use converted amount here
                minToTokenAmount: "0",
                slippage: "2",
                sameChainFee: "10",
                sameChainFeeCollector: "0x2c2505D0E21f32F38bCEBeca1C331ab4069bBCb9",
                crossChainFee: "10",
                crossChainFeeCollector: "0x2c2505D0E21f32F38bCEBeca1C331ab4069bBCb9",
                advancedSettings: {},
            };

            const result = await swapToken(oktoClient, data);
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
        const copyToClipboard = () => {
            if (jobId) {
                navigator.clipboard.writeText(jobId);
                alert("Job ID copied to clipboard!");
            }
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Swap Successful">
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-green-600 font-medium mb-2">
                            Transaction submitted successfully!
                        </div>
                        {jobId && (
                            <div className="bg-gray-100 p-3 rounded-lg relative">
                                <div className="text-sm font-mono break-all">{jobId}</div>
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                                >
                                    <span className="text-xs text-gray-600">Copy</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg"
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

            // Close details modal and reset form
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
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Swap Tokens</h1>
                    <button
                        onClick={() => loadPortfolio()}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
                )}

                {/* From Token Section */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">From</span>
                        <span className="text-sm text-gray-600">
                            Balance: {fromToken ? getBalance(fromToken) : "0"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <input
                            type="number"
                            placeholder="0.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent text-2xl font-medium w-full mr-2"
                        />
                        <button
                            onClick={() => handleTokenSelect("from")}
                            className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm"
                        >
                            {fromToken ? (
                                <>
                                    <img
                                        src={fromToken.details.logo || "/token-placeholder.png"}
                                        alt={fromToken.details.symbol}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                    />
                                    <span className="mx-2 font-medium">
                                        {fromToken.details.symbol}
                                    </span>
                                </>
                            ) : (
                                <span className="font-medium">Select</span>
                            )}
                            <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Switch Button */}
                <div className="flex justify-center -my-3">
                    <button
                        onClick={switchTokens}
                        className="bg-white p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 z-10"
                    >
                        <ArrowUpDownIcon className="w-5 h-5 text-gray-600 transform transition-transform duration-300 hover:rotate-180" />
                    </button>
                </div>

                {/* To Token Section */}
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">To</span>
                        <span className="text-sm text-gray-600">
                            Balance: {toToken ? getBalance(toToken) : "0"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="w-1/2 text-2xl font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                            {swapEstimate?.details?.estimation?.outputAmount
                                ? formattedOutputAmount(
                                    swapEstimate.details.estimation.outputAmount,
                                    toToken?.details.decimals ? parseInt(toToken.details.decimals) : 18
                                )
                                : "0.0"}
                        </div>
                        <button
                            onClick={() => handleTokenSelect("to")}
                            className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm"
                        >
                            {toToken ? (
                                <>
                                    <img
                                        src={toToken.details.logo || "/token-placeholder.png"}
                                        alt={toToken.details.symbol}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                    />
                                    <span className="mx-2 font-medium">
                                        {toToken.details.symbol}
                                    </span>
                                </>
                            ) : (
                                <span className="font-medium">Select</span>
                            )}
                            <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-400" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSwap}
                    disabled={!fromToken || !toToken || !amount}
                    className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Swap Now"}
                </button>
            </div>

            {/* Token Selection Modal */}
            <Modal
                isOpen={!!showTokenModal}
                onClose={() => setShowTokenModal(null)}
                title={`Select ${showTokenModal === "from" ? "From" : "To"} Token`}
            >
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200"
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
                title="Swap Details"
            >
                <SwapDetailsComponent
                    details={swapEstimate?.details}
                    fromAmount={amount}
                    fromToken={fromToken}
                    toToken={toToken}
                    formattedOutputAmount={swapEstimate?.details?.estimation?.outputAmount || "0.0"}
                />

                <button
                    onClick={() => {
                        // Execute swap logic
                        executeSwap();
                        setShowDetails(false);
                    }}
                    className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg"
                >
                    Confirm Swap
                </button>
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