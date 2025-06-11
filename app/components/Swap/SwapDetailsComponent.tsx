"use client";

import { TokenEntity } from "@okto_web3/react-sdk";

// Format amount from base units to human-readable format
const formatDisplayAmount = (
    amount: string,
    token: TokenEntity | null,
    maxDecimalsToShow = 6
): string => {
    if (!token || !amount) return "0";
    try {
        const decimals = Math.min(parseInt(token.details.decimals || "18"), 18);
        const bigIntAmount = BigInt(amount);
        const divisor = BigInt(10 ** decimals);

        if (bigIntAmount === BigInt(0)) return "0";

        const integerPart = (bigIntAmount / divisor).toString();
        let fractionalPart = (bigIntAmount % divisor).toString().padStart(decimals, '0');
        fractionalPart = fractionalPart.substring(0, maxDecimalsToShow);

        return parseInt(fractionalPart) === 0
            ? integerPart
            : `${integerPart}.${fractionalPart}`;
    } catch (e) {
        console.error("Error formatting amount:", e);
        return "0";
    }
};

interface SwapDetailsProps {
    details: any;
    fromAmount: string;
    fromToken: TokenEntity | null;
    toToken: TokenEntity | null;
    formattedOutputAmount: string;
}

export default function SwapDetailsComponent({ 
    details, 
    fromAmount, 
    fromToken, 
    toToken,
    formattedOutputAmount 
}: SwapDetailsProps) {
    if (!details) return null;

    const formattedFromAmount = fromAmount;
    const formattedToAmount = formatDisplayAmount(formattedOutputAmount, toToken);

    const formatFeeAmount = (feeAmount: string) => {
        return formatDisplayAmount(feeAmount, fromToken);
    };

    const TokenDisplay = ({ token }: { token: TokenEntity | null }) => {
        if (!token) return null;
        return (
            <div className="flex items-center gap-2 justify-end">
                <img
                    src={token.details.logo}
                    alt={token.details.symbol}
                    className="w-5 h-5 rounded-full"
                />
                <span className="text-black-400 text-xs">{token.details.symbol}</span>
                <span className="text-gray-400 text-xs">({token.details.name})</span>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-gray-600">You Pay</span>
                <div className="text-right">
                    <div className="font-medium">{formattedFromAmount}</div>
                    <TokenDisplay token={fromToken} />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-gray-600">You Receive</span>
                <div className="text-right">
                    <div className="font-medium">{formattedToAmount}</div>
                    <TokenDisplay token={toToken} />
                    {details.estimation.outputTokenUsdPrice && (
                        <div className="text-xs text-gray-500">
                            ≈ ${(
                                parseFloat(formattedToAmount) *
                                parseFloat(details.estimation.outputTokenUsdPrice)
                            ).toFixed(2)}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t my-3" />

            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Exchange Rate</span>
                <span>
                    1 {fromToken?.details.symbol} ≈ {(
                        parseFloat(formattedToAmount) / parseFloat(formattedFromAmount || "1")
                    ).toFixed(6)} {toToken?.details.symbol}
                </span>
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee</span>
                <span>{formatFeeAmount(details.swapFees?.platformBaseFeesInInputToken || "0")} {fromToken?.details.symbol}</span>
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gas Fee</span>
                <span>{formatFeeAmount(details.swapFees?.gasFeesInInputToken || "0")} {fromToken?.details.symbol}</span>
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Slippage</span>
                <span>{details.estimation.slippageUsed || "2"}%</span>
            </div>

            {details.route && (
                <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Route</div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                            {details.route.map((step: any, index: number) => (
                                <div key={index} className="flex items-center">
                                    <span>{step.protocol || step}</span>
                                    {index < details.route.length - 1 && (
                                        <span className="mx-1">→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="text-xs text-gray-500 mt-4 bg-blue-50 p-3 rounded-lg">
                <strong>Note:</strong> The estimated amounts are based on current market conditions and may vary at the time of transaction.
            </div>
        </div>
    );
}
