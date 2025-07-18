import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, RefreshCw, X } from 'lucide-react';
import { getOrdersHistory } from '@okto_web3/react-sdk';

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  chainData: any;
  oktoClient: any;
  intentType: any | undefined;
  onNewTransaction: () => void;
}

const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  isOpen,
  onClose,
  jobId,
  chainData,
  oktoClient,
  intentType,
  onNewTransaction
}) => {
  const [orderHistory, setOrderHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order history when modal opens
  useEffect(() => {
    if (!isOpen || !jobId) return;

    const fetchOrderHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const orders = await getOrdersHistory(oktoClient, {
          intentId: jobId,
          intentType,
        });
        setOrderHistory(orders?.[0] || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [isOpen, jobId, oktoClient, intentType]);

  const refreshOrderHistory = async () => {
    if (!jobId) return;
    setRefreshing(true);
    setError(null);
    try {
      const orders = await getOrdersHistory(oktoClient, {
        intentId: jobId,
        intentType,
      });
      setOrderHistory(orders?.[0] || null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh transaction details');
    } finally {
      setRefreshing(false);
    }
  };

  // Determine explorer URL based on chain
  const getExplorerUrl = (txHash: string) => {
    if (!chainData) return '#';
    const network = chainData.networkName.toLowerCase();
    
    if (chainData.caipId.startsWith('solana:')) {
      return `https://explorer.solana.com/tx/${txHash}?cluster=${network}`;
    } else if (chainData.caipId.startsWith('aptos:')) {
      return `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;
    } else if (chainData.caipId.startsWith('ethereum:')) {
      return `https://etherscan.io/tx/${txHash}`;
    } else if (chainData.caipId.startsWith('polygon:')) {
      return `https://polygonscan.com/tx/${txHash}`;
    }
    return '#';
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-2xl mx-4 relative overflow-hidden">
        {/* Blockchain-inspired decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full opacity-20"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Transaction Details
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse"></div>
              </div>
              <p className="text-slate-600 font-medium">Loading transaction details...</p>
            </div>
          ) : error ? (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="text-red-500" size={20} />
              </div>
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button 
                onClick={refreshOrderHistory}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : orderHistory ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="grid gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Intent ID
                      </p>
                      <p className="font-mono text-slate-800 text-sm break-all bg-slate-100 p-2 rounded-lg">
                        {orderHistory.intentId}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Status
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <div className={`w-3 h-3 rounded-full ${
                        orderHistory.status === 'SUCCESSFUL' ? 'bg-green-500 animate-pulse' : 
                        orderHistory.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                      }`}></div>
                      <span className={`font-bold text-lg ${
                        orderHistory.status === 'SUCCESSFUL' ? 'text-green-600' : 
                        orderHistory.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {orderHistory.status}
                      </span>
                    </div>
                  </div>
                  
                  {orderHistory.downstreamTransactionHash && orderHistory.downstreamTransactionHash.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                        Transaction Hash
                      </p>
                      <div className="flex items-center bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-lg p-3">
                        <span className="font-mono text-sm text-slate-700 break-all flex-1 mr-3">
                          {orderHistory.downstreamTransactionHash[0]}
                        </span>
                        <button
                          onClick={() => copyToClipboard(orderHistory.downstreamTransactionHash[0])}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {orderHistory.errorMessage && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                      <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <X size={16} />
                        Error Details
                      </p>
                      <p className="text-red-600 text-sm leading-relaxed">{orderHistory.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={refreshOrderHistory}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw 
                    size={16} 
                    className={refreshing ? 'animate-spin' : ''} 
                  />
                  {refreshing ? 'Refreshing...' : 'Refresh Status'}
                </button>
                
                {orderHistory.downstreamTransactionHash && 
                  orderHistory.downstreamTransactionHash.length > 0 && (
                  <a
                    href={getExplorerUrl(orderHistory.downstreamTransactionHash[0])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink size={16} />
                    View on Explorer
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-slate-300 rounded-sm"></div>
              </div>
              <p className="text-slate-500 font-medium">No transaction details available</p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={onNewTransaction}
              className="w-full py-4 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded opacity-80"></div>
              Create New Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStatusModal;