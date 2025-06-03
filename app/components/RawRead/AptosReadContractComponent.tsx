import { useState, useEffect } from "react";
import { useOkto, rawRead } from "@okto_web3/react-sdk";
import { Plus, X, CheckCircle, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
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
  const truncateTitle = (title: string) => {
    const [firstPart, ...rest] = title.split("::");
    const truncatedFirstPart =
      firstPart.length <= 36
        ? firstPart
        : `${firstPart.slice(0, 6)}...${firstPart.slice(-6)}`;
    return [truncatedFirstPart, ...rest].join("::");
  };
  return (
    <div className={`rounded-xl border transition-all duration-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">{truncateTitle(title)}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-gray-100">{children}</div>}
    </div>
  );
};

type AptosReadContractComponentProps = {
  caip2Id: string;
};

const AptosReadContractComponent = ({
  caip2Id,
}: AptosReadContractComponentProps) => {
  const oktoClient = useOkto();

  const [error, setError] = useState("");

  const [functions, setFunctions] = useState<
    { name: string; args: string[]; typeArguments: string[] }[]
  >([
    {
      name: "0x1::coin::name",
      args: [],
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
    },
    {
      name: "0x1::coin::symbol",
      args: [],
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
    },
    {
      name: "0x1::coin::decimals",
      args: [],
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
    },
    {
      name: "0x1::coin::balance",
      args: ["address"],
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
    },
    {
      name: "0x1::coin::supply",
      args: [],
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
    },
    // {
    //   name: "0x1::account::sequence_number",
    //   args: ["address"],
    //   typeArguments: [],
    // },
    // {
    //   name: "0x1::coin::register",
    //   args: [],
    //   typeArguments: ["0x1::aptos_coin::AptosCoin"],
    // },
    // {
    //   name: "0x1::coin::transfer",
    //   args: ["address", "u64"],
    //   typeArguments: ["0x1::aptos_coin::AptosCoin"],
    // },
    
  ]);

  const [newFunction, setNewFunction] = useState({
    name: "",
    args: "",
    typeArguments: ""
  });

  const [results, setResults] = useState<{ [fnName: string]: unknown }>({});
  const [loading, setLoading] = useState<{ [fnName: string]: boolean }>({});
  const [executionErrors, setExecutionErrors] = useState<{ [fnName: string]: string }>({});
  const [argValuesMap, setArgValuesMap] = useState<{ [fnName: string]: string[] }>({});
  const [argErrorsMap, setArgErrorsMap] = useState<{
    [fnName: string]: { [inputIdx: number]: string };
  }>({});
  const [functionIdentifier, setFunctionIdentifier] = useState<string | null>(null);

  const handleAddFunction = () => {
    const fnName = functionIdentifier ?? newFunction.name;
    if (!fnName.trim()) {
      setError("Function identifier is required.");
      return;
    }

    let parsedArgs: string[];
    let parsedTypeArgs: string[];
    try {
      parsedArgs = JSON.parse(newFunction.args || "[]");
      if (!Array.isArray(parsedArgs)) throw new Error();
    } catch {
      setError("Arguments must be a valid JSON array.");
      return;
    }

    try {
      parsedTypeArgs = JSON.parse(newFunction.typeArguments || "[]");
      if (!Array.isArray(parsedTypeArgs)) throw new Error();
    } catch {
      setError("Type arguments must be a valid JSON array.");
      return;
    }

    setFunctions((prev) => [
      ...prev,
      { name: fnName, args: parsedArgs, typeArguments: parsedTypeArgs }
    ]);
    setNewFunction({ name: "", args: "", typeArguments: "" });
    setError("");
  };

  const handleArgChange = (fnName: string, idx: number, value: string) => {
    setArgValuesMap((prev) => {
      const arr = prev[fnName] ? [...prev[fnName]] : [];
      arr[idx] = value;
      return { ...prev, [fnName]: arr };
    });
  };

  const validateArgs = (fn: { name: string; args: string[] }) => {
    const values = argValuesMap[fn.name] || [];
    const errors: { [inputIdx: number]: string } = {};
    fn.args.forEach((_, idx) => {
      if (!values[idx] || !values[idx].trim()) {
        errors[idx] = "This field is required";
      }
    });
    setArgErrorsMap((prev) => ({ ...prev, [fn.name]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleRead = async (fn: {
    name: string;
    args: string[];
    typeArguments: string[];
  }) => {
    if (!validateArgs(fn)) return;

    setLoading((prev) => ({ ...prev, [fn.name]: true }));
    setExecutionErrors((prev) => ({ ...prev, [fn.name]: "" }));
    try {
      const payload = {
        caip2Id,
        data: {
          function: fn.name,
          typeArguments: fn.typeArguments,
          functionArguments: argValuesMap[fn.name] || []
        }
      };
      const response = await rawRead(oktoClient, payload);
      setResults((prev) => ({ ...prev, [fn.name]: response }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during read";
      setExecutionErrors((prev) => ({ ...prev, [fn.name]: errorMessage }));
    } finally {
      setLoading((prev) => ({ ...prev, [fn.name]: false }));
    }
  };

  const handleRemoveFunction = (fnName: string) => {
    setFunctions((prev) => prev.filter((fn) => fn.name !== fnName));
    setArgValuesMap((prev) => {
      const copy = { ...prev };
      delete copy[fnName];
      return copy;
    });
    setArgErrorsMap((prev) => {
      const copy = { ...prev };
      delete copy[fnName];
      return copy;
    });
    setExecutionErrors((prev) => {
      const copy = { ...prev };
      delete copy[fnName];
      return copy;
    });
    setLoading((prev) => {
      const copy = { ...prev };
      delete copy[fnName];
      return copy;
    });
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[fnName];
      return copy;
    });
  };

  return (
    <div>
      {/* Add Function */}
      <CollapsibleSection
        title="Add New Function"
        icon={Plus}
        className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 my-6"
        defaultOpen={false}
      >
        <div className="space-y-4 mt-4">
          <input
            placeholder="Function Identifier (e.g. 0x1::coin::balance)"
            value={functionIdentifier ?? newFunction.name}
            onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
            className="border border-gray-300 px-4 py-3 rounded-lg w-full"
            disabled={!!functionIdentifier}
          />
          <textarea
            placeholder='Arguments JSON (e.g. ["address"])'
            value={newFunction.args}
            onChange={(e) => setNewFunction({ ...newFunction, args: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg h-20 resize-none"
          />
          <textarea
            placeholder='Type Arguments JSON (e.g. ["0x1::aptos_coin::AptosCoin"])'
            value={newFunction.typeArguments}
            onChange={(e) => setNewFunction({ ...newFunction, typeArguments: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg h-20 resize-none"
          />
          <button
            onClick={handleAddFunction}
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

      {/* Render Functions */}
      <div className="space-y-4">
        {functions.map((fn) => (
          <CollapsibleSection key={fn.name} title={fn.name} icon={InformationCircleIcon} defaultOpen={false}>
            <div className="space-y-2">
              {fn.args.map((arg, idx) => (
                <input
                  key={idx}
                  placeholder={`Arg ${idx + 1} (${arg})`}
                  value={argValuesMap[fn.name]?.[idx] || ""}
                  onChange={(e) => handleArgChange(fn.name, idx, e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full"
                />
              ))}
              {argErrorsMap[fn.name] &&
                Object.entries(argErrorsMap[fn.name]).map(([idx, msg]) => (
                  <div key={idx} className="text-red-500 text-xs">{msg}</div>
                ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleRead(fn)}
                  disabled={loading[fn.name]}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all"
                >
                  {loading[fn.name] ? "Reading..." : "Read"}
                </button>
                <button
                  onClick={() => handleRemoveFunction(fn.name)}
                  className="bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition-all"
                >
                  Remove
                </button>
              </div>
              {executionErrors[fn.name] && (
                <div className="text-red-600 text-xs mt-2">{executionErrors[fn.name]}</div>
              )}
              {results[fn.name] !== undefined && (
                <div className="bg-gray-100 rounded p-2 mt-2 flex items-center justify-between">
                  <pre className="text-xs break-all">{JSON.stringify(results[fn.name], null, 2)}</pre>
                  <CopyButton text={JSON.stringify(results[fn.name])} />
                </div>
              )}
            </div>
          </CollapsibleSection>
        ))}
      </div>

    </div>
  );
};

export default AptosReadContractComponent;
