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

const EvmReadContractComponent = ({ caip2Id, contractAddress }: { caip2Id: string; contractAddress: string }) => {
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

  // Enhanced state for add function section
  const [newAbiEntry, setNewAbiEntry] = useState({
    name: "",
    stateMutability: "view",
    inputs: [] as { name: string; type: string }[],
    outputs: [] as { name: string; type: string }[]
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

  // Add input parameter
  const addInputParameter = () => {
    setNewAbiEntry(prev => ({
      ...prev,
      inputs: [...prev.inputs, { name: "", type: "string" }]
    }));
  };

  // Remove input parameter
  const removeInputParameter = (index: number) => {
    setNewAbiEntry(prev => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index)
    }));
  };

  // Update input parameter
  const updateInputParameter = (index: number, field: 'name' | 'type', value: string) => {
    setNewAbiEntry(prev => ({
      ...prev,
      inputs: prev.inputs.map((input, i) => 
        i === index ? { ...input, [field]: value } : input
      )
    }));
  };

  // Add output parameter
  const addOutputParameter = () => {
    setNewAbiEntry(prev => ({
      ...prev,
      outputs: [...prev.outputs, { name: "", type: "string" }]
    }));
  };

  // Remove output parameter
  const removeOutputParameter = (index: number) => {
    setNewAbiEntry(prev => ({
      ...prev,
      outputs: prev.outputs.filter((_, i) => i !== index)
    }));
  };

  // Update output parameter
  const updateOutputParameter = (index: number, field: 'name' | 'type', value: string) => {
    setNewAbiEntry(prev => ({
      ...prev,
      outputs: prev.outputs.map((output, i) => 
        i === index ? { ...output, [field]: value } : output
      )
    }));
  };

  const handleAddAbiFunction = () => {
    if (!newAbiEntry.name.trim()) {
      setError("Function name is required.");
      return;
    }

    // Validate inputs
    for (let i = 0; i < newAbiEntry.inputs.length; i++) {
      const input = newAbiEntry.inputs[i];
      if (!input.type.trim()) {
        setError(`Input parameter ${i + 1} type is required.`);
        return;
      }
    }

    // Validate outputs
    for (let i = 0; i < newAbiEntry.outputs.length; i++) {
      const output = newAbiEntry.outputs[i];
      if (!output.type.trim()) {
        setError(`Output parameter ${i + 1} type is required.`);
        return;
      }
    }

    const newFunction: ABIFunction = {
      type: "function",
      name: newAbiEntry.name,
      stateMutability: newAbiEntry.stateMutability,
      inputs: newAbiEntry.inputs,
      outputs: newAbiEntry.outputs,
      constant: true,
      payable: false,
    };

    setAbiList((prev) => [...prev, newFunction]);
    setNewAbiEntry({ 
      name: "", 
      stateMutability: "view", 
      inputs: [], 
      outputs: [] 
    });
    setError("");
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

  const commonTypes = [
    "string", "uint256", "uint128", "uint64", "uint32", "uint16", "uint8",
    "int256", "int128", "int64", "int32", "int16", "int8",
    "address", "bool", "bytes", "bytes32", "bytes16", "bytes8", "bytes4"
  ];

  return (
    <div>
      {/* Add Function Section */}
      <CollapsibleSection
        title="Add New Function"
        icon={Plus}
        className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 my-6"
        defaultOpen={false}
      >
        <div className="space-y-6 mt-4">
          {/* Function Name and State Mutability */}
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

          {/* Input Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-700">Input Parameters</h4>
              <button
                onClick={addInputParameter}
                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus size={14} />
                Add Input
              </button>
            </div>
            
            {newAbiEntry.inputs.length === 0 ? (
              <p className="text-gray-500 text-sm italic p-3 bg-gray-50 rounded-lg">No input parameters. Click "Add Input" to add parameters.</p>
            ) : (
              <div className="space-y-2">
                {newAbiEntry.inputs.map((input, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      placeholder="Parameter name"
                      value={input.name}
                      onChange={(e) => updateInputParameter(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <select
                      value={input.type}
                      onChange={(e) => updateInputParameter(index, 'type', e.target.value)}
                      className="flex-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {commonTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeInputParameter(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Output Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-700">Output Parameters</h4>
              <button
                onClick={addOutputParameter}
                className="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus size={14} />
                Add Output
              </button>
            </div>
            
            {newAbiEntry.outputs.length === 0 ? (
              <p className="text-gray-500 text-sm italic p-3 bg-gray-50 rounded-lg">No output parameters. Click "Add Output" to add parameters.</p>
            ) : (
              <div className="space-y-2">
                {newAbiEntry.outputs.map((output, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      placeholder="Parameter name (optional)"
                      value={output.name}
                      onChange={(e) => updateOutputParameter(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    <select
                      value={output.type}
                      onChange={(e) => updateOutputParameter(index, 'type', e.target.value)}
                      className="flex-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      {commonTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeOutputParameter(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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