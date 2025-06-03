import { SetStateAction, useEffect, useState } from "react";
import { useOkto, rawRead, getChains } from "@okto_web3/react-sdk";
import { Pencil, Trash2, X, Plus, Copy, Settings, Eye, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import AvailableFunctionList from "./AvailableFunctionList";
import { ABIFunction } from "./ABIFunctionItem";

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
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
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
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
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
  {
    constant: true,
    inputs: [
      { name: "addr", type: "address" },
      { name: "addr", type: "address" },
    ],
    name: "VerifyAddr",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  // {
  //   constant: true,
  //   inputs: [],
  //   name: "_totalFee",
  //   outputs: [{ name: "", type: "uint256" }],
  //   payable: false,
  //   stateMutability: "view",
  //   type: "function",
  // },
  {
    constant: true,
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  // {
  //   constant: false,
  //   inputs: [
  //     { name: "_spender", type: "address" },
  //     { name: "_value", type: "uint256" },
  //   ],
  //   name: "approve",
  //   outputs: [{ name: "", type: "bool" }],
  //   payable: false,
  //   stateMutability: "nonpayable",
  //   type: "function",
  // },
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

const EvmReadContractComponent = ({ caip2Id,
  contractAddress, }: { caip2Id: string, contractAddress: string; }) => {
  const oktoClient = useOkto();

  const [abiList, setAbiList] = useState<ABIFunction[]>(defaultAbi);
  const [error, setError] = useState("");
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

  return (
    <div>
      {/* Add Function Section */}
      <CollapsibleSection
        title="Add New Function"
        icon={Plus}
        className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 my-6"
        defaultOpen={false}
      >
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Function Name"
              value={newAbiEntry.name}
              onChange={(e) => setNewAbiEntry({ ...newAbiEntry, name: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <select
              value={newAbiEntry.stateMutability}
              onChange={(e) => setNewAbiEntry({ ...newAbiEntry, stateMutability: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="view">View</option>
              <option value="pure">Pure</option>
            </select>
          </div>
          <textarea
            placeholder='Inputs JSON: [{"name": "owner", "type": "address"}]'
            value={newAbiEntry.inputs}
            onChange={(e) => setNewAbiEntry({ ...newAbiEntry, inputs: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all h-20 resize-none"
          />
          <textarea
            placeholder='Outputs JSON: [{"name": "", "type": "uint256"}]'
            value={newAbiEntry.outputs}
            onChange={(e) => setNewAbiEntry({ ...newAbiEntry, outputs: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all h-20 resize-none"
          />
          <button
            onClick={handleAddAbiFunction}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Function
          </button>
        </div>
      </CollapsibleSection>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Available Functions Section */}
      <AvailableFunctionList
        abiList={abiList}
        handleRead={handleRead}
        handleRemoveFunction={handleRemoveFunction}
        handleArgChange={handleArgChange}
        loading={loading}
        results={results}
        argValuesMap={argValuesMap}
        setAbiList={setAbiList}
        argErrorsMap={argErrorsMap}
        executionErrors={executionErrors}
      />
    </div>
  );
};

export default EvmReadContractComponent;