import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";

interface ABIInput {
  name: string;
  type: string;
}

interface ABIOutput {
  name?: string;
  type?: string;
}

export interface ABIFunction {
  constant: boolean;
  inputs: ABIInput[];
  name: string;
  outputs: ABIOutput[];
  payable: boolean;
  stateMutability: string;
  type: string;
}
interface AvailableFunctionsProps {
  abiList: ABIFunction[];
  argValuesMap: Record<string, { [inputName: string]: string } | any[]>;
  argErrorsMap: { [fnName: string]: { [inputName: string]: string } };
  executionErrors: { [fnName: string]: string };
  loading: { [fnName: string]: boolean };
  results: { [fnName: string]: unknown };
  handleArgChange: (fnName: string, inputName: string, value: string) => void;
  handleRead: (fn: ABIFunction) => void;
  handleRemoveFunction: (fnName: string) => void;
  handleUpdateFunction: (oldName: string, updatedFn: ABIFunction) => void;
}

const AvailableFunctions = ({
  abiList,
  argValuesMap,
  argErrorsMap,
  executionErrors,
  loading,
  results,
  handleArgChange,
  handleRead,
  handleRemoveFunction,
  handleUpdateFunction,
}: AvailableFunctionsProps) => {
  const [editingFn, setEditingFn] = useState<string | null>(null);
  const [editedJson, setEditedJson] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const startEditing = (fn: ABIFunction) => {
    setEditingFn(fn.name);
    setEditedJson(JSON.stringify(fn, null, 2));
    setJsonError(null);
  };

  const cancelEditing = () => {
    setEditingFn(null);
    setEditedJson("");
    setJsonError(null);
  };

  const saveEditedFunction = () => {
    try {
      const updatedFn: ABIFunction = JSON.parse(editedJson);

      // Validate the edited function
      if (!updatedFn.name) throw new Error("Function name is required");
      if (!updatedFn.type) throw new Error("Function type is required");
      if (!updatedFn.inputs) throw new Error("Inputs array is required");
      if (!Array.isArray(updatedFn.inputs)) throw new Error("Inputs must be an array");

      handleUpdateFunction(editingFn!, updatedFn);
      setEditingFn(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON structure");
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {abiList.map((fn) => (
        <div
          key={fn.name}
          className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{fn.name}</h4>
              <p className="text-sm text-gray-500">State Mutability: {fn.stateMutability} function</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEditing(fn)}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleRemoveFunction(fn.name)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {editingFn === fn.name ? (
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Edit ABI JSON:
              </label>

              {jsonError && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-3 mb-2">
                  <p className="text-red-700 font-medium">Validation Error:</p>
                  <p className="text-red-600 text-sm">{jsonError}</p>
                </div>
              )}

              <textarea
                value={editedJson}
                onChange={(e) => {
                  setEditedJson(e.target.value);
                  setJsonError(null);
                }}
                rows={10}
                className={`w-full border ${jsonError ? "border-red-500" : "border-gray-300"
                  } p-3 rounded-lg font-mono text-sm bg-gray-50`}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEditedFunction}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-1"
                >
                  <Check size={16} /> Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {fn.inputs.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h5 className="font-medium text-gray-700">Parameters:</h5>
                  {fn.inputs.map((input) => {
                    const error = argErrorsMap[fn.name]?.[input.name];
                    return (
                      <div key={input.name}>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {input.name} ({input.type})
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter ${input.name}`}
                          value={
                            Array.isArray(argValuesMap[fn.name])
                              ? ""
                              : (argValuesMap[fn.name] as { [key: string]: string })?.[input.name] ?? ""
                          }
                          onChange={(e) => handleArgChange(fn.name, input.name, e.target.value)}
                          className={`w-full border ${error ? "border-red-500" : "border-gray-300"
                            } px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        />
                        {error && (
                          <p className="text-red-500 text-xs mt-1">{error}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => handleRead(fn)}
                disabled={loading[fn.name]}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              >
                {loading[fn.name] ? "Loading..." : "Execute"}
              </button>

              {executionErrors[fn.name] && (
                <div className="mt-4 border border-red-200 bg-red-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-red-700">Execution Error:</h5>
                  <pre className="text-sm text-red-900 whitespace-pre-wrap break-words mt-2">
                    {executionErrors[fn.name]}
                  </pre>
                </div>
              )}

              {results[fn.name] !== undefined && !executionErrors[fn.name] && (
                <div className="mt-4 border border-green-200 bg-green-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-green-700">Result:</h5>
                  <pre className="text-sm text-green-900 whitespace-pre-wrap break-words mt-2">
                    {JSON.stringify(results[fn.name], null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export { AvailableFunctions };