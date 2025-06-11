"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface TokenListProps {
  tokens: any[];
  portfolio: any;
  loading: boolean;
  onSelect: (token: any) => void;
}

export default function TokenList({ tokens, portfolio, loading, onSelect }: TokenListProps) {
  const getBalance = (token: any) => {
    if (!portfolio?.groupTokens) return "0";
    const found = portfolio.groupTokens.find(
      (t: any) => t.tokenAddress === token.details.address
    );
    return found?.viewBalance || "0";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (tokens.length === 0) {
    return <div className="text-center py-4 text-gray-500">No tokens found</div>;
  }

  return (
    <div className="space-y-2">
      {tokens.map((token) => (
        <button
          key={token.id}
          onClick={() => onSelect(token)}
          className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg"
        >
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
          <div className="ml-auto text-right">
            <div className="font-medium">
              ${parseFloat(token.details.price).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Bal: {getBalance(token)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}