/** @format */

"use client";
import { useEffect, useState } from "react";
import {
    useOkto,
    getChains,
    getAccount,
    getOrdersHistory,
} from "@okto_web3/react-sdk";
import { aptosRawTransaction } from "@okto_web3/react-sdk/userop";
import { useRouter } from "next/navigation";
import CopyButton from "../components/CopyButton";
import ViewExplorerURL from "../components/ViewExplorerURL";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) =>
    !isOpen ? null : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );

const RefreshIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
    </svg>
);

function AptosRawTransaction() {
    const oktoClient = useOkto();
    const navigate = useRouter();

    const [chains, setChains] = useState<any[]>([]);
    const [selectedChain, setSelectedChain] = useState<any>("");
    const [functionName, setFunctionName] = useState("");
    const [typeArguments, setTypeArguments] = useState("");
    const [functionArguments, setFunctionArguments] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [userOp, setUserOp] = useState<any | null>(null);
    const [signedUserOp, setSignedUserOp] = useState<any | null>(null);
    const [orderHistory, setOrderHistory] = useState<any | null>(null);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [feePayerAddress, setFeePayerAddress] = useState<`0x${string}` | undefined>(undefined);

    const showModal = (modal: string) => setActiveModal(modal);
    const closeAllModals = () => setActiveModal(null);

    const resetForm = () => {
        setSelectedChain("");
        setFunctionName("");
        setTypeArguments("");
        setFunctionArguments("");
        setUserOp(null);
        setSignedUserOp(null);
        setJobId(null);
        setOrderHistory(null);
        setError(null);
        closeAllModals();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedChains, fetchedAccounts] = await Promise.all([
                    getChains(oktoClient),
                    getAccount(oktoClient),
                ]);
                setChains(fetchedChains);
                setAccounts(fetchedAccounts);
            } catch (error: any) {
                console.error("Error fetching data:", error);
                setError(`Failed to fetch data: ${error.message}`);
            }
        };
        fetchData();
    }, [oktoClient]);

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCaipId = e.target.value;
        setSelectedChain(selectedCaipId);
        const selectedChainObj = chains.find(
            (chain) => chain.caipId === selectedCaipId
        );
        setSponsorshipEnabled(selectedChainObj?.sponsorshipEnabled || false);
    };

    const handleGetOrderHistory = async (id?: string) => {
        const intentId = id || jobId;
        if (!intentId) {
            setError("No job ID available");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orders = await getOrdersHistory(oktoClient, {
                intentId,
                intentType: "RAW_TRANSACTION",
            });
            setOrderHistory(orders?.[0]);
            setActiveModal("orderHistory");
        } catch (error: any) {
            console.error("Error in fetching order history", error);
            setError(`Error fetching transaction details: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshOrderHistory = async () => {
        if (!jobId) return;
        setIsRefreshing(true);
        try {
            const orders = await getOrdersHistory(oktoClient, {
                intentId: jobId,
                intentType: "RAW_TRANSACTION",
            });
            setOrderHistory(orders?.[0]);
        } catch (error: any) {
            console.error("Error refreshing order history", error);
            setError(`Error refreshing transaction details: ${error.message}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleCreateUserOp = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const rawTransactionIntentParams = {
                caip2Id: selectedChain,
                function: functionName,
                typeArguments: typeArguments.split(",").filter(Boolean),
                functionArguments: functionArguments.split(",").filter(Boolean),
            };

            const createdUserOp = await aptosRawTransaction(
                oktoClient,
                rawTransactionIntentParams,
                feePayerAddress
            );
            setUserOp(createdUserOp);
            showModal("unsignedOp");
        } catch (error: any) {
            console.error("Error creating UserOp:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUserOp = async () => {
        if (!userOp) {
            setError("No transaction to sign");
            return;
        }

        setIsLoading(true);
        try {
            const signedOp = await oktoClient.signUserOp(userOp);
            setSignedUserOp(signedOp);
            showModal("signedOp");
        } catch (error: any) {
            console.error("Error signing UserOp:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteUserOp = async () => {
        if (!signedUserOp) {
            setError("No signed transaction to execute");
            return;
        }

        setIsLoading(true);
        try {
            const jobId = await oktoClient.executeUserOp(signedUserOp);
            setJobId(jobId);
            await handleGetOrderHistory(jobId);
            showModal("jobId");
        } catch (error: any) {
            console.error("Error executing UserOp:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderModals = () => (
        <>
            {/* Job ID Modal */}
            <Modal
                isOpen={activeModal === "jobId"}
                onClose={() => showModal("orderHistory")}
                title="Transaction Submitted"
            >
                <div className="space-y-4 text-white">
                    <p>Your Aptos transaction has been submitted successfully.</p>
                    <div className="bg-gray-700 p-3 rounded">
                        <p className="text-sm text-gray-300 mb-1">Job ID:</p>
                        <CopyButton text={jobId ?? ""} />
                        <p className="font-mono break-all">{jobId}</p>
                    </div>
                    <div className="flex justify-center pt-2">
                        <button
                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full"
                            onClick={() => handleGetOrderHistory()}
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Check Aptos Transaction Status"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Unsigned Transaction Modal */}
            <Modal
                isOpen={activeModal === "unsignedOp"}
                onClose={closeAllModals}
                title="Review Aptos Transaction"
            >
                <div className="space-y-4 text-white">
                    <p>Review your Aptos transaction details before signing:</p>
                    <div className="bg-gray-700 p-3 rounded">
                        <p className="text-sm text-gray-300 mb-1">Transaction Details:</p>
                        <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
                            <CopyButton text={JSON.stringify(userOp, null, 2) ?? ""} />
                            <pre>{JSON.stringify(userOp, null, 2)}</pre>
                        </div>
                        {feePayerAddress && (
                            <>
                                <br />
                                <p className="text-sm text-gray-300 mb-1">
                                    <span>Fee Payer:</span> {feePayerAddress}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="flex justify-center pt-2">
                        <button
                            className="p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors w-full"
                            onClick={handleSignUserOp}
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing..." : "Sign Aptos Transaction"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Signed Transaction Modal */}
            <Modal
                isOpen={activeModal === "signedOp"}
                onClose={closeAllModals}
                title="Sign Completed"
            >
                <div className="space-y-4 text-white">
                    <p>Aptos transaction signed successfully. Ready for execution.</p>
                    <div className="bg-gray-700 p-3 rounded">
                        <p className="text-sm text-gray-300 mb-1">Signed Transaction:</p>
                        <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
                            <CopyButton text={JSON.stringify(signedUserOp, null, 2) ?? ""} />
                            <pre>{JSON.stringify(signedUserOp, null, 2)}</pre>
                        </div>
                    </div>
                    <div className="flex justify-center pt-2">
                        <button
                            className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors w-full"
                            onClick={handleExecuteUserOp}
                            disabled={isLoading}
                        >
                            {isLoading ? "Executing..." : "Execute Aptos Transaction"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Order History Modal */}
            <Modal
                isOpen={activeModal === "orderHistory"}
                onClose={closeAllModals}
                title="Aptos Transaction Details"
            >
                <div className="space-y-4 text-white">
                    <div className="flex justify-between items-center">
                        <p>Aptos Transaction Details:</p>
                    </div>

                    {orderHistory ? (
                        <div className="bg-gray-700 p-4 rounded-md">
                            <p>
                                <span className="font-semibold">Intent ID:</span>{" "}
                                {orderHistory.intentId}
                            </p>
                            <p>
                                <span className="font-semibold">Status:</span>{" "}
                                {orderHistory.status}
                            </p>
                            <p>
                                <span className="font-semibold">Transaction Hash:</span>
                            </p>
                            <pre className="break-all whitespace-pre-wrap overflow-auto bg-gray-800 p-2 rounded-md text-sm max-w-full">
                                <CopyButton
                                    text={orderHistory.downstreamTransactionHash[0] ?? ""}
                                />
                                {orderHistory.downstreamTransactionHash[0]}
                            </pre>
                        </div>
                    ) : (
                        <p className="text-gray-400">No transaction history available.</p>
                    )}

                    {orderHistory && (
                        <>
                            {orderHistory.status === "SUCCESSFUL" ? (
                                <div className="flex justify-center w-full pt-2">
                                    <ViewExplorerURL orderHistory={orderHistory} />
                                    <p className="text-sm text-gray-400 mt-2">
                                        Note: Aptos transactions might take a few moments to appear on explorer
                                    </p>
                                </div>
                            ) : (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={refreshOrderHistory}
                                        className="flex gap-x-3 justify-center items-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full text-center"
                                        disabled={isRefreshing}
                                    >
                                        {isRefreshing ? (
                                            <span>Refreshing...</span>
                                        ) : (
                                            <>
                                                <RefreshIcon /> Refresh Status
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-center pt-2">
                        <button
                            className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors w-full"
                            onClick={resetForm}
                        >
                            Create New Aptos Transaction
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );

    return (
        <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-900 w-full">
            <button
                onClick={() => navigate.push("/")}
                className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-8"
            >
                Home
            </button>
            <h1 className="text-white font-bold text-3xl mb-8">
                Aptos Raw Transaction
            </h1>
            <p className="text-white text-lg mb-6">
                Learn more in our{" "}
                <a
                    className="underline text-indigo-300"
                    href="https://docs.okto.tech/docs/nextjs-sdk/aptosRawTransaction"
                    target="_blank"
                    rel="noopener"
                >
                    documentation
                </a>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-2xl">
                <div className="bg-black p-6 rounded-lg border border-gray-800">
                    <div className="w-full my-2">
                        <label className="block text-sm text-gray-300 mb-1">
                            Select Aptos Network
                        </label>
                        <select
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                            value={selectedChain}
                            onChange={handleNetworkChange}
                            disabled={isLoading}
                        >
                            <option value="" disabled>Select Aptos network</option>
                            {chains
                                .filter(chain => chain.caipId.startsWith('aptos:'))
                                .map(chain => (
                                    <option key={chain.chainId} value={chain.caipId}>
                                        {chain.networkName}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {selectedChain && (
                        <p className="text-sm text-gray-300 border border-indigo-700 p-2 my-2">
                            {sponsorshipEnabled
                                ? "Gas sponsorship available ✅"
                                : "⚠️ Native tokens required for gas"}
                        </p>
                    )}

                    <div className="w-full my-2">
                        <label className="block text-sm text-gray-300 mb-1">
                            Function Name
                        </label>
                        <input
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                            value={functionName}
                            onChange={(e) => setFunctionName(e.target.value)}
                            placeholder="module::function"
                        />
                    </div>

                    <div className="w-full my-2">
                        <label className="block text-sm text-gray-300 mb-1">
                            Type Arguments (comma-separated)
                        </label>
                        <input
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                            value={typeArguments}
                            onChange={(e) => setTypeArguments(e.target.value)}
                            placeholder="Type1, Type2"
                        />
                    </div>

                    <div className="w-full my-2">
                        <label className="block text-sm text-gray-300 mb-1">
                            Function Arguments (comma-separated)
                        </label>
                        <input
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                            value={functionArguments}
                            onChange={(e) => setFunctionArguments(e.target.value)}
                            placeholder="arg1, arg2"
                        />
                    </div>

                    {/* Fee Payer Address */}
                    <div className="w-full my-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Fee Payer Address (Optional)
                        </label>
                        <input
                            className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={feePayerAddress}
                            onChange={(e: { target: { value: any; }; }) => {
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

                    <button
                        className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
                        onClick={handleCreateUserOp}
                        disabled={!selectedChain || !functionName || isLoading}
                    >
                        {isLoading ? "Creating..." : "Create Aptos Transaction"}
                    </button>
                </div>
            </div>

            {renderModals()}
        </main>
    );
}

export default AptosRawTransaction;