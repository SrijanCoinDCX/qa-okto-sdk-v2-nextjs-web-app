/** @format */

"use client";
import { useEffect, useState } from "react";
import {
  Address,
  getChains,
  getOrdersHistory,
  useOkto,
  type OktoClient,
} from "@okto_web3/react-sdk";
import { useRouter } from "next/navigation";
import { nftMint } from "@okto_web3/react-sdk/userop";
import CopyButton from "../components/CopyButton";

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

function MintNFT() {
  const oktoClient = useOkto();
  const router = useRouter();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [chains, setChains] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedChain, setSelectedChain] = useState("");
  const [nftName, setNftName] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [uri, setUri] = useState("");
  const [recipientWalletAddress, setRecipientWalletAddress] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState<Array<{
    name: string;
    valueType: string;
    value: string;
  }>>([{ name: "", valueType: "string", value: "" }]);
  const [feePayerAddress, setFeePayerAddress] = useState("");

  // Transaction states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [userOp, setUserOp] = useState<any | null>(null);
  const [signedUserOp, setSignedUserOp] = useState<any | null>(null);
  const [orderHistory, setOrderHistory] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainsData = await getChains(oktoClient);
        setChains(chainsData);
      } catch (error: any) {
        console.error("Error fetching chains:", error);
        setError(`Failed to fetch chains: ${error.message}`);
      }
    };
    fetchChains();
  }, [oktoClient]);

  const validateFormData = () => {
    if (
      !selectedChain ||
      !nftName ||
      !collectionAddress ||
      !uri ||
      !recipientWalletAddress ||
      properties.some(p => !p.name || !p.value)
    ) {
      throw new Error("Please fill in all required fields");
    }
    
    if (!selectedChain.startsWith("aptos:")) {
      throw new Error("NFT Minting is only supported on Aptos chain");
    }
  };

  const handleAddProperty = () => {
    setProperties([...properties, { name: "", valueType: "string", value: "" }]);
  };

  const handlePropertyChange = (index: number, field: string, value: string) => {
    const newProperties = [...properties];
    newProperties[index] = { ...newProperties[index], [field]: value };
    setProperties(newProperties);
  };

  const handleRemoveProperty = (index: number) => {
    const newProperties = properties.filter((_, i) => i !== index);
    setProperties(newProperties);
  };

  const handleMintNft = async () => {
    setIsLoading(true);
    setError(null);

    try {
      validateFormData();
      
      const mintParams = {
        caip2Id: selectedChain,
        nftName,
        collectionAddress: collectionAddress as Address,
        uri,
        data: {
          recipientWalletAddress: recipientWalletAddress as Address,
          description,
          properties: properties.map(p => ({
            name: p.name,
            valueType: p.valueType,
            value: p.value
          }))
        }
      };

      const userOp = await nftMint(oktoClient as OktoClient, mintParams, feePayerAddress as Address);
      setUserOp(userOp);
      setActiveModal("unsignedOp");
      console.log("Mint UserOp:", userOp);
    } catch (error: any) {
      console.error("Error creating mint operation:", error);
      setError(`Error: ${error.message}`);
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
      setActiveModal("signedOp");
    } catch (error: any) {
      console.error("Error signing userOp:", error);
      setError(`Signing failed: ${error.message}`);
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
      setActiveModal("jobId");
    } catch (error: any) {
      console.error("Error executing userOp:", error);
      setError(`Execution failed: ${error.message}`);
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
        intentType: "NFT_MINT",
      });
      setOrderHistory(orders?.[0]);
      setActiveModal("orderHistory");
    } catch (error: any) {
      console.error("Error fetching order history:", error);
      setError(`History fetch failed: ${error.message}`);
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
        intentType: "NFT_MINT",
      });
      setOrderHistory(orders?.[0]);
    } catch (error: any) {
      console.error("Error refreshing history:", error);
      setError(`Refresh failed: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-900 w-full">
      <button
        onClick={() => router.push("/")}
        className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mb-8"
      >
        Home
      </button>

      <h1 className="text-white font-bold text-3xl mb-8">Mint NFT</h1>

      {error && (
        <div className="w-full max-w-2xl bg-red-900/50 border border-red-700 text-red-100 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-2xl">
        <div className="bg-black p-6 rounded-lg border border-gray-800">
          {/* Chain Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Network</label>
            <select
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
            >
              <option value="">Select Network</option>
              {chains
                .filter((c) => c.caipId.startsWith("aptos:"))
                .map((chain) => (
                  <option key={chain.caipId} value={chain.caipId}>
                    {chain.networkName}
                  </option>
                ))}
            </select>
          </div>

          {/* NFT Details */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">NFT Name</label>
            <input
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Collection Address</label>
            <input
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">URI</label>
            <input
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
          </div>

          {/* Recipient */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Recipient Address</label>
            <input
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={recipientWalletAddress}
              onChange={(e) => setRecipientWalletAddress(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Description</label>
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Properties */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Properties</label>
            {properties.map((prop, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  placeholder="Name"
                  value={prop.name}
                  onChange={(e) => handlePropertyChange(index, "name", e.target.value)}
                />
                <select
                  className="w-24 p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  value={prop.valueType}
                  onChange={(e) => handlePropertyChange(index, "valueType", e.target.value)}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <input
                  className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  placeholder="Value"
                  value={prop.value}
                  onChange={(e) => handlePropertyChange(index, "value", e.target.value)}
                />
                <button
                  onClick={() => handleRemoveProperty(index)}
                  className="px-3 bg-red-600 rounded hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={handleAddProperty}
              className="mt-2 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Add Property
            </button>
          </div>

          {/* Fee Payer */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Fee Payer Address (Optional)</label>
            <input
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
              value={feePayerAddress}
              onChange={(e) => setFeePayerAddress(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              onClick={handleMintNft}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Mint Operation"}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === "unsignedOp"}
        onClose={() => setActiveModal(null)}
        title="Review Mint Operation"
      >
        <div className="space-y-4 text-white">
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(userOp, null, 2)}
          </pre>
          <button
            className="w-full p-3 bg-green-600 hover:bg-green-700 rounded"
            onClick={handleSignUserOp}
          >
            Sign Transaction
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "signedOp"}
        onClose={() => setActiveModal(null)}
        title="Signed Transaction"
      >
        <div className="space-y-4 text-white">
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(signedUserOp, null, 2)}
          </pre>
          <button
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded"
            onClick={handleExecuteUserOp}
          >
            Execute Transaction
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "jobId"}
        onClose={() => setActiveModal(null)}
        title="Mint Transaction Submitted"
      >
        <div className="space-y-4 text-white">
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-300">Job ID:</p>
            <CopyButton text={jobId || ""} />
            <p className="font-mono break-all">{jobId}</p>
          </div>
          <button
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded"
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
          {orderHistory && (
            <div className="bg-gray-700 p-4 rounded">
              <p>Status: {orderHistory.status}</p>
              {orderHistory.downstreamTransactionHash?.[0] && (
                <a
                  href={`https://explorer.aptoslabs.com/txn/${orderHistory.downstreamTransactionHash[0]}?network=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}
          <button
            className="w-full p-3 bg-gray-600 hover:bg-gray-700 rounded"
            onClick={() => setActiveModal(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </main>
  );
}

export default MintNFT;