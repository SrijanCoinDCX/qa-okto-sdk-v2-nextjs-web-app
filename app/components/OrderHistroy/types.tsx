import { Order, OrderDetails } from "@okto_web3/react-sdk";
import { ArrowRight, ExternalLink, ImageIcon, PaintBucket } from "lucide-react";

// Extend the basic Order interface to include more comprehensive transaction details
export interface ExtendedOrder extends Order {
    intentId: string;
    intentType: 'SWAP' | 'TOKEN_TRANSFER' | 'RAW_TRANSACTION' | 'NFT_MINT' | 'NFT_TRANSFER' | 'NFT_CREATE_COLLECTION';
    status: | 'NOT_EXISTS'
    | 'INITIATED'
    | 'IN_PROGRESS'
    | 'SUCCESSFUL'
    | 'FAILED'
    | 'EXPIRED'
    | 'PENDING'
    | 'BUNDLER_DISCARDED'
    | 'FAILED_ON_CHAIN';
    blockTimestamp: number;
    networkName: string;
    reason?: string;
    details?: OrderDetails & {
        // Additional fields for different transaction types
        fromChainTokenAmount?: string;
        fromChainTokenAddress?: string;
        toChainTokenAddress?: string;
        fromChainCaip2Id?: string;
        toChainCaip2Id?: string;
        slippage?: string;
        routeId?: string;
        sameChainFee?: string;
        amount?: string;
        recipientWalletAddress?: string;
        transactions?: Array<Array<{ Key: string, Value: string }>>;
        // NFT related fields
        name?: string;
        uri?: string;
        caip2id?: string;
        collectionAddress?: string;
        nftName?: string;
        data?: Array<{ Key: string, Value: string | any[] }>;
    };
    transactionHash?: string[];
    caipId?: string;
}

// Transaction type details for rendering
export const INTENT_TYPE_DETAILS = {
    'SWAP': {
        title: 'Token Swap',
        detailRenderer: (tx: ExtendedOrder) => (
            <>
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">From</p>
                        <p className="font-medium text-white">
                            {formatAmount(tx.details?.fromChainTokenAmount)} <span className="text-yellow-400">{tx.details?.fromChainTokenAddress?.slice(0, 6)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {tx.details?.fromChainCaip2Id}
                        </p>
                    </div>
                    <ArrowRight className="text-yellow-500 mx-4" />
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">To</p>
                        <p className="font-medium text-white">
                            <span className="text-yellow-400">{tx.details?.toChainTokenAddress?.slice(0, 6) || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {tx.details?.toChainCaip2Id}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-500">Slippage</p>
                        <p className="font-medium text-white">{tx.details?.slippage}%</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-500">Network</p>
                        <p className="font-medium text-white">{tx.networkName}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-500">Route ID</p>
                        <div className="flex items-center gap-1">
                            <p className="font-medium text-yellow-400 text-xs truncate">
                                {tx.details?.routeId}
                            </p>
                            <button className="text-gray-500 hover:text-gray-400">
                                <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-500">Fee</p>
                        <p className="font-medium text-white">{tx.details?.sameChainFee}%</p>
                    </div>
                </div>
            </>
        )
    },
    'TOKEN_TRANSFER': {
        title: 'Token Transfer',
        detailRenderer: (tx: ExtendedOrder) => (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium text-white">
                            {formatAmount(tx.details?.amount || '0')} {getTokenSymbolFromAddress(tx.details?.tokenAddress)}
                        </p>
                    </div>
                    <ArrowRight className="text-yellow-500 mx-4" />
                    <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-yellow-400">
                                {tx.details?.recipientWalletAddress?.slice(0, 6)}...{tx.details?.recipientWalletAddress?.slice(-4)}
                            </p>
                            <button className="text-gray-500 hover:text-gray-400">
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    'RAW_TRANSACTION': {
        title: 'Raw Transaction',
        detailRenderer: (tx: ExtendedOrder) => {
            // Extract transaction details
            const txDetails = tx.details?.transactions?.[0];
            const functionCall = txDetails?.find(detail => detail.Key === 'function')?.Value;
            const args = txDetails?.filter(detail => detail.Key === 'functionArguments')?.[0]?.Value;
            
            return (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500">Function Call</p>
                        <p className="font-medium text-white bg-gray-900 p-2 rounded mt-1">
                            {functionCall || 'Unknown Function'}
                        </p>
                    </div>
                    
                    {Array.isArray(args) && args.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500">Arguments</p>
                            <div className="mt-1 space-y-2">
                                {args.map((arg, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-900 p-2 rounded">
                                        <span className="text-gray-500">{index + 1}:</span>
                                        <p className="font-medium text-yellow-400 text-sm truncate">
                                            {typeof arg === 'string' ? arg : JSON.stringify(arg)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    },
    'NFT_MINT': {
        title: 'NFT Mint',
        detailRenderer: (tx: ExtendedOrder) => {
            const recipientWalletAddress = tx.details?.data?.find(item => item.Key === 'recipientWalletAddress')?.Value;
            const description = tx.details?.data?.find(item => item.Key === 'description')?.Value;
            
            return (
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-900 rounded-lg p-2 flex-shrink-0">
                                <ImageIcon size={48} className="text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white mb-1">{tx.details?.nftName || 'Unnamed NFT'}</h3>
                                <p className="text-sm text-gray-400">{description || 'No description'}</p>
                                {tx.details?.uri && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-xs text-gray-500">Metadata URI:</p>
                                        <a href={tx.details.uri} target="_blank" rel="noopener noreferrer" className="text-yellow-400 text-xs flex items-center hover:underline">
                                            {truncateMiddle(tx.details.uri, 30)}
                                            <ExternalLink size={12} className="ml-1" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-500">Network</p>
                            <p className="font-medium text-white">{tx.details?.caip2id || tx.networkName}</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-500">Recipient</p>
                            <div className="flex items-center gap-1">
                                <p className="font-medium text-yellow-400 text-xs truncate">
                                    {typeof recipientWalletAddress === 'string' ? 
                                        `${recipientWalletAddress.slice(0, 6)}...${recipientWalletAddress.slice(-4)}` : 
                                        'Unknown'}
                                </p>
                                <button className="text-gray-500 hover:text-gray-400">
                                    <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    'NFT_TRANSFER': {
        title: 'NFT Transfer',
        detailRenderer: (tx: ExtendedOrder) => (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">NFT</p>
                        <p className="font-medium text-white">
                            {tx.details?.nftName || 'Unnamed NFT'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {tx.details?.collectionAddress?.slice(0, 6)}...{tx.details?.collectionAddress?.slice(-4) || 'Unknown Collection'}
                        </p>
                    </div>
                    <ArrowRight className="text-yellow-500 mx-4" />
                    <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-yellow-400">
                                {tx.details?.recipientWalletAddress?.slice(0, 6)}...{tx.details?.recipientWalletAddress?.slice(-4)}
                            </p>
                            <button className="text-gray-500 hover:text-gray-400">
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    'NFT_CREATE_COLLECTION': {
        title: 'Create NFT Collection',
        detailRenderer: (tx: ExtendedOrder) => {
            const symbol = tx.details?.data?.find(item => item.Key === 'symbol')?.Value;
            const description = tx.details?.data?.find(item => item.Key === 'description')?.Value;
            
            return (
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-900 rounded-lg p-2 flex-shrink-0">
                                <PaintBucket size={48} className="text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white mb-1">{tx.details?.name || 'Unnamed Collection'}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-yellow-500 bg-opacity-20 rounded text-yellow-300 text-xs">
                                        {symbol || 'No Symbol'}
                                    </span>
                                    <p className="text-sm text-gray-400">{description || 'No description'}</p>
                                </div>
                                {tx.details?.uri && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-xs text-gray-500">Collection URI:</p>
                                        <a href={tx.details.uri} target="_blank" rel="noopener noreferrer" className="text-yellow-400 text-xs flex items-center hover:underline">
                                            {truncateMiddle(tx.details.uri, 30)}
                                            <ExternalLink size={12} className="ml-1" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-500">Network</p>
                            <p className="font-medium text-white">{tx.details?.caip2id || tx.networkName}</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-500">Blockchain</p>
                            <p className="font-medium text-white">{tx.caipId || 'Unknown'}</p>
                        </div>
                    </div>
                </div>
            );
        }
    }
};