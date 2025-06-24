import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, RefreshCw, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { getChains, getPortfolio, GetSupportedNetworksResponseData, getTokens, Token, useOkto, UserOp, UserPortfolioData, EstimationDetails } from '@okto_web3/react-sdk';
import { TransferFormData } from './types/types';
import { TokenTransferIntentParams, tokenTransferWithEstimate } from '@okto_web3/react-sdk/userop';

// Extend the Token type to include decimals if not present
type TokenWithDecimals = {
    address: string;
    symbol: string;
    caipId: string;
    decimals: number;
    [key: string]: any;
};

const TokenTransferEstimate = () => {
    const oktoClient = useOkto();

    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [chains, setChains] = useState<GetSupportedNetworksResponseData[]>([]);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [portfolio, setPortfolio] = useState<UserPortfolioData | null>(null);

    const [formData, setFormData] = useState<TransferFormData>({
        selectedChain: '',
        selectedToken: '',
        amount: '',
        recipient: '',
        feePayerAddress: ''
    });

    const [estimate, setEstimate] = useState<EstimationDetails | null >();
    
    const [userOp, setUserOp] = useState<UserOp | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEstimateDetails, setShowEstimateDetails] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [chainsData, portfolioData] = await Promise.all([
                    getChains(oktoClient),
                    getPortfolio(oktoClient)
                ]);
                setChains(chainsData);
                setPortfolio(portfolioData);
            } catch (err) {
                setError('Failed to fetch initial data');
            }
        };
        fetchInitialData();
    }, [oktoClient]);

    // Fetch tokens when chain changes
    useEffect(() => {
        const fetchTokens = async () => {
            if (!formData.selectedChain) return;

            try {
                const tokensData = await getTokens(oktoClient);
                const filteredTokens = tokensData.filter(token => token.caipId === formData.selectedChain);
                setTokens(filteredTokens);
            } catch (err) {
                setError('Failed to fetch tokens');
            }
        };
        fetchTokens();
    }, [formData.selectedChain, oktoClient]);

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const getTokenBalance = (symbol: string) => {
        if (!portfolio?.groupTokens) return null;
        const token = portfolio.groupTokens.find(t => t.symbol === symbol);
        return token || null;
    };

    const validateForm = () => {
        if (!formData.selectedChain) return 'Please select a network';
        if (!formData.selectedToken) return 'Please select a token';
        if (!formData.amount || Number(formData.amount) <= 0) return 'Please enter a valid amount';
        if (!formData.recipient) return 'Please enter a valid recipient address';
        return null;
    };

    const handleGetEstimate = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = tokens.find(t => t.symbol === formData.selectedToken);
            if (!token) {
                setError('Selected token not found');
                setLoading(false);
                return;
            }

            const params: TokenTransferIntentParams = {
                amount: BigInt(formData.amount),
                recipient: formData.recipient as `0x${string}`,
                token: token.address as `0x${string}`,
                caip2Id: formData.selectedChain,
            };

            const result = await tokenTransferWithEstimate(
                oktoClient,
                params,
                formData.feePayerAddress && formData.feePayerAddress.startsWith('0x')
                    ? formData.feePayerAddress as `0x${string}`
                    : undefined
            );
            setEstimate(result.details as EstimationDetails);
            setUserOp(result.userOp);
            setCurrentStep(2);
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'Failed to get estimate'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteTransaction = async () => {
        if (!userOp) return;

        setLoading(true);
        setError('');

        try {
            const signedOp = await oktoClient.signUserOp(userOp);
            const executionJobId = await oktoClient.executeUserOp(signedOp);
            setJobId(executionJobId);
            setCurrentStep(3);
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'Failed to execute transaction'
            );
        } finally {
            setLoading(false);
        }
    };

    const resetTransaction = () => {
        setCurrentStep(1);
        setEstimate(null);
        setUserOp(null);
        setJobId(null);
        setError('');
        setFormData({
            selectedChain: '',
            selectedToken: '',
            amount: '',
            recipient: '',
            feePayerAddress: ''
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);
    let selectedTokenData = tokens.find(t => t.symbol === formData.selectedToken) as TokenWithDecimals | undefined;
    const tokenBalance = getTokenBalance(formData.selectedToken);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Transfer</h1>
                <p className="text-gray-600">Transfer tokens with gas estimation and optimization</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 1 ? <Check size={16} /> : '1'}
                    </div>
                    <span className="ml-2 font-medium">Setup Transfer</span>
                </div>

                <ArrowRight className="text-gray-400" size={20} />

                <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 2 ? <Check size={16} /> : '2'}
                    </div>
                    <span className="ml-2 font-medium">Review & Execute</span>
                </div>

                <ArrowRight className="text-gray-400" size={20} />

                <div className={`flex items-center ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep >= 3 ? <Check size={16} /> : '3'}
                    </div>
                    <span className="ml-2 font-medium">Complete</span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <AlertCircle className="text-red-600 mr-2" size={20} />
                    <span className="text-red-800">{error}</span>
                </div>
            )}

            {/* Step 1: Transfer Setup */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Network Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Network
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.selectedChain}
                                    onChange={(e) => updateFormData('selectedChain', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Network</option>
                                    {chains.map((chain) => (
                                        <option key={chain.chainId} value={chain.caipId}>
                                            {chain.networkName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400" size={20} />
                            </div>
                            {selectedChainData && (
                                <div className={`mt-2 p-2 rounded text-sm ${selectedChainData.sponsorshipEnabled ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                                    {selectedChainData.sponsorshipEnabled ? '✅ Gas sponsorship available' : '⚠️ Gas sponsorship not available'}
                                </div>
                            )}
                        </div>

                        {/* Token Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Token
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.selectedToken}
                                    onChange={(e) => updateFormData('selectedToken', e.target.value)}
                                    disabled={!formData.selectedChain}
                                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                >
                                    <option value="">Select Token</option>
                                    {tokens.map((token) => (
                                        <option key={token.address} value={token.symbol}>
                                            {token.symbol}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400" size={20} />
                            </div>
                            {tokenBalance && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Balance: {Number(tokenBalance.balance).toFixed(6)} {formData.selectedToken}
                                    (${tokenBalance.holdingsPriceUsdt})
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (in smallest unit)
                        </label>
                        <input
                            type="text"
                            value={formData.amount}
                            onChange={(e) => updateFormData('amount', e.target.value)}
                            placeholder="Enter amount"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {selectedTokenData && (
                            <div className="mt-1 text-sm text-gray-500">
                                This token has {selectedTokenData.decimals} decimals
                            </div>
                        )}
                    </div>

                    {/* Recipient Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={formData.recipient}
                            onChange={(e) => updateFormData('recipient', e.target.value)}
                            placeholder="0x..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Fee Payer Address (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fee Payer Address (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.feePayerAddress}
                            onChange={(e) => updateFormData('feePayerAddress', e.target.value)}
                            placeholder="Enter fee payer address for sponsored transactions"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Get Estimate Button */}
                    <button
                        onClick={handleGetEstimate}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={20} />
                                Getting Estimate...
                            </>
                        ) : (
                            'Get Transfer Estimate'
                        )}
                    </button>
                </div>
            )}

            {/* Step 2: Review & Execute */}
            {currentStep === 2 && estimate && (
                <div className="space-y-6">
                    {/* Transaction Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Network:</span>
                                <span className="ml-2 font-medium">{selectedChainData?.networkName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Token:</span>
                                <span className="ml-2 font-medium">{formData.selectedToken}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Amount:</span>
                                <span className="ml-2 font-medium">{formData.amount}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Recipient:</span>
                                <span className="ml-2 font-medium font-mono text-xs">{formData.recipient}</span>
                            </div>
                        </div>
                    </div>

                    {/* Gas Estimate */}
                    <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Gas Estimation</h3>
                            <button
                                onClick={() => setShowEstimateDetails(!showEstimateDetails)}
                                className="text-blue-600 hover:text-blue-700 flex items-center"
                            >
                                {showEstimateDetails ? 'Hide' : 'Show'} Details
                                <ChevronDown className={`ml-1 transform ${showEstimateDetails ? 'rotate-180' : ''}`} size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Estimated Gas Fees</div>
                                {estimate.fees?.transactionFees && Object.entries(estimate.fees.transactionFees).map(([network, fee]) => (
                                    <div key={network} className="text-xl font-bold text-blue-600">
                                        {fee} ETH
                                    </div>
                                ))}
                                {estimate.fees?.approxTransactionFeesInUSDT && (
                                    <div className="text-sm text-gray-500">
                                        ≈ ${estimate.fees.approxTransactionFeesInUSDT}
                                    </div>
                                )}
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Total Fees</div>
                                {estimate.estimation?.totalFeesInInputToken && (
                                    <div className="text-xl font-bold text-green-600">
                                        {estimate.estimation.totalFeesInInputToken}
                                    </div>
                                )}
                                {estimate.fees?.approxTransactionFeesInUSDT && (
                                    <div className="text-sm text-gray-500">
                                        ≈ ${estimate.fees.approxTransactionFeesInUSDT}
                                    </div>
                                )}
                            </div>
                        </div>

                        {showEstimateDetails && userOp && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">User Operation Details</h4>
                                <div className="space-y-2 text-sm font-mono">
                                    <div className="flex justify-between">
                                        <span>Call Gas Limit:</span>
                                        <span>{userOp.callGasLimit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Verification Gas:</span>
                                        <span>{userOp.verificationGasLimit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pre-verification Gas:</span>
                                        <span>{userOp.preVerificationGas}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Max Fee Per Gas:</span>
                                        <span>{userOp.maxFeePerGas}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Max Priority Fee:</span>
                                        <span>{userOp.maxPriorityFeePerGas}</span>
                                    </div>
                                    {userOp.paymaster && (
                                        <div className="flex justify-between">
                                            <span>Paymaster:</span>
                                            <span className="truncate max-w-fit">{userOp.paymaster}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {estimate.gsn?.isPossible && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center text-green-800">
                                    <Check className="mr-2" size={16} />
                                    <span className="font-medium">Gas Station Network Available</span>
                                </div>
                                <div className="text-sm text-green-600 mt-1">
                                    This transaction can be sponsored using GSN
                                </div>
                                {estimate.gsn.isRequired && (
                                    <div className="text-sm text-orange-600 mt-1">
                                        ⚠️ GSN sponsorship is required for this transaction
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300"
                        >
                            Back to Edit
                        </button>
                        <button
                            onClick={handleExecuteTransaction}
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin mr-2" size={20} />
                                    Executing...
                                </>
                            ) : (
                                'Execute Transaction'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Transaction Complete */}
            {currentStep === 3 && jobId && (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="text-green-600" size={40} />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Transaction Submitted!</h3>
                        <p className="text-gray-600">Your token transfer has been successfully submitted to the network.</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Transaction ID</div>
                        <div className="flex items-center justify-center space-x-2">
                            <code className="bg-white px-3 py-2 rounded border font-mono text-sm">{jobId}</code>
                            <button
                                onClick={() => copyToClipboard(jobId)}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4 justify-center">
                        <button
                            onClick={resetTransaction}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700"
                        >
                            Make Another Transfer
                        </button>
                        <button onClick={() => window.location.href = '/'} className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 flex items-center">
                            View on Explorer
                            <ExternalLink className="ml-2" size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TokenTransferEstimate;