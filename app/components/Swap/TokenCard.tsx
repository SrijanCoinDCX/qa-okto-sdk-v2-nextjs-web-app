"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface TokenCardProps {
  token: any;
  balance?: string;
  onSelect?: () => void;
}

export function TokenCard({ token, balance, onSelect }: TokenCardProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
    >
      {token && (
        <>
          <img
            src={token.details.logo || "/token-placeholder.png"}
            alt={token.details.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="ml-3 text-left">
            <div className="font-medium">{token.details.symbol}</div>
            <div className="text-sm text-gray-500">{token.details.networkName}</div>
          </div>
          {balance && (
            <div className="ml-auto text-sm text-gray-600">Bal: {balance}</div>
          )}
        </>
      )}
      {!token && <div className="font-medium">Select Token</div>}
      <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-400" />
    </button>
  );
}