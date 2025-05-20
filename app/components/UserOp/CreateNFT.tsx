/** @format */
"use client";
import { useState, useEffect } from "react";
import {
  Address,
  getOrdersHistory,
  OktoClient,
  useOkto,
  getChains,
} from "@okto_web3/react-sdk";
import { nftCreateCollection } from "@okto_web3/react-sdk/userop";
import { useRouter } from "next/navigation";
import CopyButton from "../CopyButton";
import ViewExplorerURL from "../ViewExplorerURL";

interface Chain {
  caipId: string;
  networkName: string;
  gsnEnabled: boolean;
  sponsorshipEnabled: boolean;
  blockExplorerUrls?: string[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) =>
  isOpen ? (
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
  ) : null;

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

function CreateNftCollection() {
  const oktoClient = useOkto();
  const router = useRouter();

  // Form state
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [uri, setUri] = useState("");
  const [symbol, setSymbol] = useState("");
  const [collectionType, setCollectionType] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState("");
  const [feePayerAddress, setFeePayerAddress] = useState<Address>();

  // Transaction state
  const [jobId, setJobId] = useState<string | null>(null);
  const [userOp, setUserOp] = useState<any>(null);
  const [signedUserOp, setSignedUserOp] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const initializeChains = async () => {
      try {
        const chainList = await getChains(oktoClient);
        setChains(chainList);
        const aptosChain = chainList.find(c => c.caipId.startsWith("aptos:"));
        if (aptosChain) setSelectedChain(aptosChain.caipId);
      } catch (error: any) {
        setError(`Failed to fetch chains: ${error.message}`);
      }
    };
    initializeChains();
  }, [oktoClient]);

  const validateForm = () => {
    if (!selectedChain) throw new Error("Please select a network");
    if (!collectionName.trim()) throw new Error("Collection name is required");
    if (!uri.trim()) throw new Error("Metadata URI is required");
    if (!selectedChain.toLowerCase().startsWith("aptos:")) {
      throw new Error("NFT collection creation only supported on Aptos");
    }
    if (attributes) {
      try {
        JSON.parse(attributes);
      } catch {
        throw new Error("Invalid JSON format for attributes");
      }
    }
  };

  const handleCreateCollection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      validateForm();

      const collectionData = {
        caip2Id: selectedChain,
        name: collectionName,
        uri,
        data: {
          type: collectionType,
          symbol,
          description,
          attributes: attributes ? JSON.parse(attributes) : undefined,
        }
      };

      const userOp = await nftCreateCollection(oktoClient, collectionData, feePayerAddress);
      setUserOp(userOp);
      setActiveModal("unsignedOp");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUserOp = async () => {
    if (!userOp) return;
    setIsLoading(true);
    try {
      const signedOp = await oktoClient.signUserOp(userOp);
      setSignedUserOp(signedOp);
      setActiveModal("signedOp");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteUserOp = async () => {
    if (!signedUserOp) return;
    setIsLoading(true);
    try {
      const jobId = await oktoClient.executeUserOp(signedUserOp);
      setJobId(jobId);
      await handleGetOrderHistory(jobId);
      setActiveModal("jobId");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOrderHistory = async (id?: string) => {
    const intentId = id || jobId;
    if (!intentId) return;
    setIsLoading(true);
    try {
      const orders = await getOrdersHistory(oktoClient, {
        intentId,
        intentType: "NFT_CREATE_COLLECTION",
      });
      setOrderHistory(orders?.[0]);
      if (orders?.[0]?.downstreamTransactionHash?.[0]) {
        const chain = chains.find(c => c.caipId === selectedChain);
        setExplorerUrl(chain?.blockExplorerUrls?.[0] || null);
      }
    } catch (error: any) {
      setError(error.message);
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
        intentType: "NFT_CREATE_COLLECTION",
      });
      setOrderHistory(orders?.[0]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetForm = () => {
    setCollectionName("");
    setUri("");
    setSymbol("");
    setCollectionType("");
    setDescription("");
    setAttributes("");
    setUserOp(null);
    setSignedUserOp(null);
    setJobId(null);
    setOrderHistory(null);
    setActiveModal(null);
  };

  return (
    <div className="w-full bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <button
          onClick={() => router.push("/")}
          className="text-white hover:text-gray-300"
        >
          ← Back to Home
        </button>

        <h1 className="text-2xl font-bold text-white">Create NFT Collection</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-100 p-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Network
            </label>
            <select
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              disabled={isLoading}
            >
              {chains
                .filter(c => c.caipId.startsWith("aptos:"))
                .map((chain) => (
                  <option key={chain.caipId} value={chain.caipId}>
                    {chain.networkName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Collection Name *
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="My Awesome Collection"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Metadata URI *
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="ipfs://Qm... or https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Symbol (optional)
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g., AWESOME"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type (optional)
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={collectionType}
              onChange={(e) => setCollectionType(e.target.value)}
              placeholder="e.g., Digital Art"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Attributes (JSON, optional)
            </label>
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-mono"
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
              placeholder={'{\n  "trait_type": "value"\n}'}
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fee Payer Address (optional)
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={feePayerAddress || ""}
              onChange={(e) => setFeePayerAddress(e.target.value as Address)}
              placeholder="0x..."
            />
          </div>

          <button
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
            onClick={handleCreateCollection}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === "unsignedOp"}
        onClose={() => setActiveModal(null)}
        title="Review Collection Creation"
      >
        <div className="space-y-4 text-white">
          <p>Please review your collection details before signing.</p>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Transaction Details:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
              <CopyButton text={JSON.stringify(userOp, null, 2)} />
              <pre>{JSON.stringify(userOp, null, 2)}</pre>
            </div>
          </div>
          <button
            className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded"
            onClick={handleSignUserOp}
            disabled={isLoading}
          >
            {isLoading ? "Signing..." : "Sign Transaction"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "signedOp"}
        onClose={() => setActiveModal(null)}
        title="Signed Transaction"
      >
        <div className="space-y-4 text-white">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Signed UserOp:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
              <CopyButton text={JSON.stringify(signedUserOp, null, 2)} />
              <pre>{JSON.stringify(signedUserOp, null, 2)}</pre>
            </div>
          </div>
          <button
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded"
            onClick={handleExecuteUserOp}
            disabled={isLoading}
          >
            {isLoading ? "Executing..." : "Execute Transaction"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "jobId"}
        onClose={() => setActiveModal(null)}
        title="Transaction Submitted"
      >
        <div className="space-y-4 text-white">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Job ID:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm">
              <CopyButton text={jobId || ""} />
              <p className="break-all">{jobId}</p>
            </div>
          </div>
          <button
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
            onClick={() => handleGetOrderHistory()}
          >
            Check Transaction Status
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "orderHistory"}
        onClose={() => setActiveModal(null)}
        title="Transaction Details"
      >
        <div className="space-y-4 text-white">
          {orderHistory ? (
            <div className="bg-gray-700 p-3 rounded">
              <p className="text-sm text-gray-300 mb-1">Status:</p>
              <p className="font-bold">{orderHistory.status}</p>
              
              {orderHistory.downstreamTransactionHash?.[0] && (
                <>
                  <p className="text-sm text-gray-300 mt-3 mb-1">Transaction Hash:</p>
                  <div className="bg-gray-900 p-2 rounded font-mono text-sm">
                    <CopyButton text={orderHistory.downstreamTransactionHash[0]} />
                    <p className="break-all">
                      {orderHistory.downstreamTransactionHash[0]}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No transaction details available</p>
          )}

          <div className="flex gap-4">
            {orderHistory?.status === "SUCCESSFUL" && explorerUrl && (
              <ViewExplorerURL
                txHash={orderHistory.downstreamTransactionHash[0]}
                explorerUrl={explorerUrl}
              />
            )}
            
            <button
              className="flex-1 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded"
              onClick={resetForm}
            >
              Create New Collection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CreateNftCollection;