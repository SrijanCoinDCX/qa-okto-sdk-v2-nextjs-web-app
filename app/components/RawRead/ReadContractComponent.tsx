import { SetStateAction, useEffect, useState } from "react";
import { useOkto, rawRead, getChains } from "@okto_web3/react-sdk";
import { Pencil, Trash2, X, Plus, Copy, Settings, Eye, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { ABIFunction } from "./ABIFunctionItem";
import AptosReadContractComponent from "./AptosReadContractComponent";
import EvmReadContractComponent from "./EVMReadContractComponent";

const defaultAbi: ABIFunction[] = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
    >
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  className = ""
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

const DynamicReadContractComponent = () => {
  const oktoClient = useOkto();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [caip2Id, setCaip2Id] = useState("eip155:8453");
  const [functionIdentifier, setFunctionIdentifier] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [abiList, setAbiList] = useState<ABIFunction[]>(defaultAbi);
  // const [results, setResults] = useState<Record<string, any>>({});
  // const [argValuesMap, setArgValuesMap] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState("");
  // const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [argValuesMap, setArgValuesMap] = useState<{ [fnName: string]: { [inputName: string]: string } }>({});
  const [argErrorsMap, setArgErrorsMap] = useState<{ [fnName: string]: { [inputName: string]: string } }>({});
  const [executionErrors, setExecutionErrors] = useState<{ [fnName: string]: string }>({});
  const [loading, setLoading] = useState<{ [fnName: string]: boolean }>({});
  const [results, setResults] = useState<{ [fnName: string]: unknown }>({});
  const [chains, setChains] = useState<any[]>([]);
  const [loadingChains, setLoadingChains] = useState(true);


  const [newAbiEntry, setNewAbiEntry] = useState({
    name: "",
    inputs: "",
    outputs: "",
    stateMutability: "view",
  });

  const [isAptosChain, setIsAptosChain] = useState(false);

  // Detect chain type when CAIP2 ID changes
  useEffect(() => {
    setIsAptosChain(caip2Id.startsWith("aptos:"));
  }, [caip2Id]);

  // Fetch chains on component mount
  useEffect(() => {
    const fetchChains = async () => {
      setLoadingChains(true);
      try {
        const chainsData = await getChains(oktoClient);
        setChains(chainsData);
      } catch (error: any) {
        console.error("Error fetching chains:", error);
        setError(`Failed to fetch chains: ${error.message}`);
      } finally {
        setLoadingChains(false);
      }
    };
    fetchChains();
  }, [oktoClient]);
  const handleAddAbiFunction = () => {
    if (!newAbiEntry.name.trim()) {
      setError("Function name is required.");
      return;
    }

    try {
      const parsedInputs = JSON.parse(newAbiEntry.inputs || "[]");
      const parsedOutputs = JSON.parse(newAbiEntry.outputs || "[]");

      const newFunction = {
        type: "function",
        name: newAbiEntry.name,
        stateMutability: newAbiEntry.stateMutability,
        inputs: parsedInputs,
        outputs: parsedOutputs,
        constant: true,
        payable: false,
      };

      setAbiList((prev) => [...prev, newFunction]);
      setNewAbiEntry({ name: "", inputs: "", outputs: "", stateMutability: "view" });
      setError("");
    } catch (err) {
      setError("Invalid input or output JSON format.");
    }
  };

  const handleArgChange = (fnName: string, inputName: string, value: string) => {
    setArgValuesMap(prev => ({
      ...prev,
      [fnName]: {
        ...(prev[fnName] || {}),
        [inputName]: value
      }
    }));

    // Clear existing error when user types
    setArgErrorsMap(prev => {
      const fnErrors = { ...(prev[fnName] || {}) };
      delete fnErrors[inputName];
      return {
        ...prev,
        [fnName]: fnErrors
      };
    });
  };

  const validateArgs = (fn: ABIFunction) => {
    const errors: { [inputName: string]: string } = {};
    const values = argValuesMap[fn.name] || {};

    fn.inputs.forEach(input => {
      const value = values[input.name] || '';

      if (!value.trim()) {
        errors[input.name] = "This field is required";
      }
      else if (input.type.includes("int") && !/^-?\d+$/.test(value)) {
        errors[input.name] = "Must be an integer";
      }
      else if (input.type.includes("bool") && !/^(true|false)$/i.test(value)) {
        errors[input.name] = "Must be true or false";
      }
      else if (input.type.includes("address") && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
        errors[input.name] = "Invalid Ethereum address";
      }
    });

    setArgErrorsMap(prev => ({
      ...prev,
      [fn.name]: errors
    }));

    return Object.keys(errors).length === 0;
  };


  const handleRead = async (fn: ABIFunction) => {
    // Validate inputs first
    if (!validateArgs(fn)) return;

    setLoading(prev => ({ ...prev, [fn.name]: true }));
    setExecutionErrors(prev => ({ ...prev, [fn.name]: "" }));

    setError("");
    setLoading(prev => ({ ...prev, [fn.name]: true }));

    if (!contractAddress || !caip2Id) {
      setError("Please fill contract and chain info.");
      setLoading(prev => ({ ...prev, [fn.name]: false }));
      return;
    }

    const argsMap = argValuesMap[fn.name] || {};
    const args: Record<string, any> = {};

    for (const input of fn.inputs) {
      const val = argsMap[input.name];
      if (!val && input.type !== "bool") {
        setError(`Missing value for ${input.name}`);
        setLoading(prev => ({ ...prev, [fn.name]: false }));
        return;
      }
      args[input.name] = val;
    }

    try {
      const payload = {
        caip2Id,
        data: {
          contractAddress,
          abi: fn,
          args,
        },
      };
      const response = await rawRead(oktoClient, payload);
      setResults((prev) => ({ ...prev, [fn.name]: response }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error during read";
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, [fn.name]: false }));
    }
  };

  const handleRemoveFunction = (fnName: string) => {
    setAbiList(prev => prev.filter(fn => fn.name !== fnName));

    // Clean up related state
    const newArgValues = { ...argValuesMap };
    delete newArgValues[fnName];
    setArgValuesMap(newArgValues);

    const newArgErrors = { ...argErrorsMap };
    delete newArgErrors[fnName];
    setArgErrorsMap(newArgErrors);

    const newExecutionErrors = { ...executionErrors };
    delete newExecutionErrors[fnName];
    setExecutionErrors(newExecutionErrors);

    const newLoading = { ...loading };
    delete newLoading[fnName];
    setLoading(newLoading);

    const newResults = { ...results };
    delete newResults[fnName];
    setResults(newResults);
  };


  const PopupContent = () => (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-bold">Dynamic Contract Reader</h2>
          </div>
          <button
            onClick={() => setIsPopupOpen(false)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
          {/* Configuration Section */}
          <CollapsibleSection
            title="Configuration"
            icon={Settings}
            className="bg-gray-50 border-gray-200"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chain (CAIP2)
                </label>
                <input
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={caip2Id}
                  onChange={(e) => setCaip2Id(e.target.value)}
                  placeholder="Enter chain CAIP ID"
                />
                {/* 
                <select
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={caip2Id}
                  onChange={(e) => setCaip2Id(e.target.value)}
                >
                  <option value="">Select a chain</option>
                  {chains.map((chain) => (
                    <option key={chain.caipId} value={chain.caipId}>
                      {chain.caipId}
                    </option>
                  ))}
                </select>
                */}
              </div>
              {isAptosChain ? (
                <div></div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Address
                  </label>
                  <input
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>
          {isAptosChain ? (
            <AptosReadContractComponent caip2Id={caip2Id} />
          ) : (
            <EvmReadContractComponent caip2Id={caip2Id} contractAddress={contractAddress} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsPopupOpen(true)}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Raw Read
      </button>

      {/* Popup Modal */}
      {isPopupOpen && <PopupContent />}
    </>
  );
};

export default DynamicReadContractComponent;