import React, { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { ABIFunction, AvailableFunctions } from "./ABIFunctionItem";


type AvailableFunctionListProps = {
  abiList: ABIFunction[];
  setAbiList: React.Dispatch<React.SetStateAction<ABIFunction[]>>;
  handleRemoveFunction: (fnName: string) => void;
  handleRead: (fn: ABIFunction) => void;
  argValuesMap: Record<string, { [inputName: string]: string } | any[]>;
  handleArgChange: (fnName: string, inputName: string, value: string) => void;
  loading: Record<string, boolean>;
  results: Record<string, any>;
  argErrorsMap: Record<string, Record<string, string>>;
  executionErrors: Record<string, string>;
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

const AvailableFunctionList: React.FC<AvailableFunctionListProps> = ({
  abiList,
  setAbiList,
  handleRemoveFunction,
  handleRead,
  argValuesMap,
  handleArgChange,
  loading,
  results,
  argErrorsMap,
  executionErrors,
}) => {
  const handleUpdateFunction = (oldName: string, updatedFn: ABIFunction) => {
    setAbiList((prevList) =>
      prevList.map((fn) => (fn.name === oldName ? updatedFn : fn))
    );
  };
  return (
    <CollapsibleSection
      title={`Available Functions (${abiList.length})`}
      icon={Eye}
      className="bg-white border-gray-200"
      defaultOpen={true}
    >
      <AvailableFunctions
        abiList={abiList}
        argValuesMap={argValuesMap}
        loading={loading}
        handleArgChange={handleArgChange}
        handleRead={handleRead}
        handleRemoveFunction={handleRemoveFunction}
        results={results}
        handleUpdateFunction={handleUpdateFunction} 
        argErrorsMap={argErrorsMap} 
        executionErrors={executionErrors} />
    </CollapsibleSection>
  );
};

export default AvailableFunctionList;
