"use client";

import { useState, useEffect, SetStateAction } from 'react';
import { 
    ChevronDown, ChevronUp, ArrowRight, Check, X, ExternalLink, 
    Filter, HexagonIcon, ActivityIcon, XCircle, Loader2, RefreshCw 
} from 'lucide-react';
import { useOkto, getOrdersHistory, Order, OrderDetails } from '@okto_web3/react-sdk';

// Extend the basic Order interface to include more comprehensive transaction details
interface ExtendedOrder extends Order {
    intentId: string;
    intentType: 'SWAP' | 'TOKEN_TRANSFER' | 'RAW_TRANSACTION';
    status: 'SUCCESSFUL' | 'FAILED';
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
        transactions?: Array<Array<{Key: string, Value: string}>>;
    };
    transactionHash?: string[];
    caipId?: string;
}

// Transaction type details for rendering
const INTENT_TYPE_DETAILS = {
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
                            {formatAmount(tx.details?.amount || '0')}
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
            const fromAddress = txDetails?.find(detail => detail.Key === 'from')?.Value;
            const toAddress = txDetails?.find(detail => detail.Key === 'to')?.Value;
            const value = txDetails?.find(detail => detail.Key === 'value')?.Value;

            return (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">From</p>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-yellow-400">
                                    {fromAddress?.slice(0, 6)}...{fromAddress?.slice(-4)}
                                </p>
                                <button className="text-gray-500 hover:text-gray-400">
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                        <ArrowRight className="text-yellow-500 mx-4" />
                        <div>
                            <p className="text-sm text-gray-500">To</p>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-yellow-400">
                                    {toAddress?.slice(0, 6)}...{toAddress?.slice(-4)}
                                </p>
                                <button className="text-gray-500 hover:text-gray-400">
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium text-white">
                            {formatAmount(value || '0')}
                        </p>
                    </div>
                </div>
            );
        }
    }
};

interface OrderHistoryPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

// Utility functions
const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatAmount = (amount?: string) => {
    if (!amount) return '0.0000';
    const value = parseInt(amount, 16) / 1000000000000000000;
    return value.toFixed(value < 0.0001 ? 8 : 4);
};

const OrderHistoryPopup = ({ isOpen, onClose }: OrderHistoryPopupProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortField, setSortField] = useState('blockTimestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [transactions, setTransactions] = useState<ExtendedOrder[]>([]);
    const [selectedIntentType, setSelectedIntentType] = useState<string | null>(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const oktoClient = useOkto();

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleSort = (field: SetStateAction<string>) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleIntentFilter = (intentType: string | null) => {
        setSelectedIntentType(intentType);
        setShowFilterDropdown(false);
    };

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const response = await getOrdersHistory(oktoClient);
            if (response) {
                setTransactions(response as ExtendedOrder[]);
            }
        } catch (error) {
            console.error('Error fetching transaction history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique intent types dynamically
    const uniqueIntentTypes = [...new Set(transactions.map(tx => tx.intentType))];

    useEffect(() => {
        if (!isOpen) return;
        fetchTransactions();
    }, [oktoClient, isOpen]);

    // Filter transactions based on selected intent type
    const filteredTransactions = selectedIntentType 
        ? transactions.filter(tx => tx.intentType === selectedIntentType)
        : transactions;

    // Sort transactions
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        let aValue = a[sortField as keyof Order];
        let bValue = b[sortField as keyof Order];

        if (sortField === 'blockTimestamp' && 'blockTimestamp' in a && 'blockTimestamp' in b) {
            aValue = (a as any).blockTimestamp;
            bValue = (b as any).blockTimestamp;
        }

        if (sortDirection === 'asc') {
            return (aValue ?? 0) > (bValue ?? 0) ? 1 : -1;
        } else {
            return (aValue ?? 0) < (bValue ?? 0) ? 1 : -1;
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-700 animate-fadeIn">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <ActivityIcon className="text-yellow-400 h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Filters and Sorting */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        {/* Intent Type Filter */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white border border-gray-700 flex items-center gap-2"
                            >
                                <Filter size={16} className="text-yellow-400" />
                                {selectedIntentType 
                                    ? INTENT_TYPE_DETAILS[selectedIntentType as keyof typeof INTENT_TYPE_DETAILS].title 
                                    : 'Filter by Type'
                                }
                                <ChevronDown size={14} className="ml-1" />
                            </button>
                            
                            {showFilterDropdown && (
                                <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
                                    <div className="py-1">
                                        <button 
                                            onClick={() => handleIntentFilter(null)}
                                            className={`block w-full text-left px-4 py-2 text-sm ${!selectedIntentType ? 'bg-gray-700 text-yellow-400' : 'text-gray-300 hover:bg-gray-700'}`}
                                        >
                                            All Transactions
                                        </button>
                                        {uniqueIntentTypes.map((type) => (
                                            <button 
                                                key={type}
                                                onClick={() => handleIntentFilter(type)}
                                                className={`block w-full text-left px-4 py-2 text-sm ${selectedIntentType === type ? 'bg-gray-700 text-yellow-400' : 'text-gray-300 hover:bg-gray-700'}`}
                                            >
                                                {INTENT_TYPE_DETAILS[type as keyof typeof INTENT_TYPE_DETAILS].title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Sorting */}
                        <button
                            onClick={() => handleSort('blockTimestamp')}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white border border-gray-700 flex items-center gap-2"
                        >
                            Date {sortField === 'blockTimestamp' && (
                                sortDirection === 'asc' ? <ChevronUp size={16} className="text-yellow-400" /> : <ChevronDown size={16} className="text-yellow-400" />
                            )}
                        </button>

                        {/* Status Sorting */}
                        <button
                            onClick={() => handleSort('status')}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white border border-gray-700 flex items-center gap-2"
                        >
                            Status {sortField === 'status' && (
                                sortDirection === 'asc' ? <ChevronUp size={16} className="text-yellow-400" /> : <ChevronDown size={16} className="text-yellow-400" />
                            )}
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchTransactions}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white border border-gray-700 flex items-center gap-2"
                        >
                            <RefreshCw size={16} className="text-yellow-400" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Active Filter Indicator */}
                {selectedIntentType && (
                    <div className="mx-6 my-4 px-4 py-2 bg-yellow-500 bg-opacity-20 rounded-lg text-sm flex justify-between items-center border border-yellow-600 border-opacity-30">
                        <span className="text-yellow-300 flex items-center gap-2">
                            <HexagonIcon size={16} />
                            Showing {INTENT_TYPE_DETAILS[selectedIntentType as keyof typeof INTENT_TYPE_DETAILS].title.toLowerCase()} only
                        </span>
                        <button 
                            onClick={() => setSelectedIntentType(null)}
                            className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                        >
                            <X size={14} /> Clear filter
                        </button>
                    </div>
                )}

                {/* Transactions List */}
                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <Loader2 size={40} className="animate-spin mb-4 text-yellow-400" />
                            <p>Loading transaction history...</p>
                        </div>
                    ) : sortedTransactions.length === 0 ? (
                        <div className="text-center p-12 text-gray-400 bg-gray-800 rounded-lg border border-dashed border-gray-700">
                            <ActivityIcon size={40} className="mx-auto mb-4 text-gray-600" />
                            {selectedIntentType 
                                ? `No ${INTENT_TYPE_DETAILS[selectedIntentType as keyof typeof INTENT_TYPE_DETAILS].title.toLowerCase()} transactions found` 
                                : 'No transactions found'}
                        </div>
                    ) : (
                        sortedTransactions.map((tx) => (
                            <div 
                                key={tx.intentId} 
                                className="border border-gray-800 rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-750 transition-colors"
                            >
                                {/* Transaction Header */}
                                <div 
                                    onClick={() => toggleExpand(tx.intentId)}
                                    className="flex justify-between items-center p-4 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`p-2 rounded-lg ${
                                            tx.status === 'SUCCESSFUL' ? 'bg-green-900 text-green-400' : 
                                            tx.status === 'FAILED' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'
                                        }`}>
                                            {tx.status === 'SUCCESSFUL' ? <Check size={20} /> : 
                                             tx.status === 'FAILED' ? <X size={20} /> : <Loader2 size={20} />}
                                        </div>
                                        
                                        {/* Transaction Details */}
                                        <div>
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                {INTENT_TYPE_DETAILS[tx.intentType as keyof typeof INTENT_TYPE_DETAILS].title}
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                                <span className="text-sm font-normal text-gray-400">{tx.networkName}</span>
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatTimestamp(tx.blockTimestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Status and Expand/Collapse */}
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
                                            tx.status === 'SUCCESSFUL' ? 'text-green-400 border-green-800 bg-green-900 bg-opacity-30' : 
                                            tx.status === 'FAILED' ? 'text-red-400 border-red-800 bg-red-900 bg-opacity-30' : 'text-yellow-400 border-yellow-800 bg-yellow-900 bg-opacity-30'
                                        }`}>
                                            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                                        </span>
                                        {expandedId === tx.intentId ? 
                                            <ChevronUp className="text-gray-500" /> : 
                                            <ChevronDown className="text-gray-500" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded Transaction Details */}
                                {expandedId === tx.intentId && (
                                    <div className="p-4 bg-gray-900 border-t border-gray-700 space-y-4">
                                        {/* Render specific details based on intent type */}
                                        {INTENT_TYPE_DETAILS[tx.intentType as keyof typeof INTENT_TYPE_DETAILS].detailRenderer(tx)}

                                        {/* Error Message for Failed Transactions */}
                                        {tx.status === 'FAILED' && (
                                            <div className="p-3 bg-red-900 bg-opacity-30 rounded-lg border border-red-800">
                                                <p className="text-sm font-medium text-red-400">Error:</p>
                                                <p className="text-sm text-red-300 mt-1">
                                                    {tx.reason || 'Transaction failed unexpectedly'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Transaction Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-700">
                                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                                <p className="text-sm text-gray-500">Transaction ID</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-yellow-400 text-xs truncate">
                                                        {tx.intentId}
                                                    </p>
                                                    <button className="text-gray-500 hover:text-gray-400">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                                <p className="text-sm text-gray-500">Transaction Hash</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-yellow-400 text-xs truncate">
                                                        {tx.transactionHash?.[0]?.slice(0, 12)}...{tx.transactionHash?.[0]?.slice(-6)}
                                                    </p>
                                                    <button className="text-gray-500 hover:text-gray-400">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Order History Button Component
const OrderHistoryButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg flex items-center gap-2"
            >
                <ActivityIcon size={18} />
                Transaction History
            </button>
            
            <OrderHistoryPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default OrderHistoryButton;