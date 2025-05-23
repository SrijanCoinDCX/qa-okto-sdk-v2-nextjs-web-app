import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, RefreshCw, Check, AlertCircle, Copy, ExternalLink, Zap, Shield, Cpu, Plus, Trash2 } from 'lucide-react';
import {
    getChains,
    useOkto,
    UserOp,
    EstimationDetails,
    getAccount,
} from '@okto_web3/react-sdk';
import {
    AptosRawTransactionIntentParams,
    aptosRawTransactionWithEstimate
} from '@okto_web3/react-sdk/userop';
import { BaseError } from 'viem';

interface AptosTransaction {
    function: string;
    typeArguments?: string[];
    functionArguments?: any[];
}

const AptosRawTransactionEstimate = () => {
    const oktoClient = useOkto();

    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedChain, setSelectedChain] = useState<any>("");
    const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
    const [chains, setChains] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        selectedChain: '',
        fromAddress: '',
        feePayerAddress: ''
    });

    const [transactions, setTransactions] = useState<AptosTransaction[]>([{
        function: '',
        typeArguments: [],
        functionArguments: []
    }]);

    const [estimate, setEstimate] = useState<EstimationDetails | null>(null);
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
                const [chainsData, accountsData] = await Promise.all([
                    getChains(oktoClient),
                    getAccount(oktoClient)
                ]);
                // Filter only Aptos chains
                const aptosChains = chainsData.filter(chain =>
                    chain.caipId.toLowerCase().startsWith('aptos:')
                );
                setChains(aptosChains);
                setAccounts(accountsData);
            } catch (err) {
                setError('Failed to fetch supported chains and accounts');
            }
        };
        fetchInitialData();
    }, [oktoClient]);

    // Auto-set from address when chain is selected
    useEffect(() => {
        if (!formData.selectedChain) {
            setFormData(prev => ({ ...prev, fromAddress: '' }));
            return;
        }

        const matchedAccount = accounts.find(
            (account) => account.caipId === formData.selectedChain
        );
        setFormData(prev => ({
            ...prev,
            fromAddress: matchedAccount ? matchedAccount.address : ''
        }));
    }, [formData.selectedChain, accounts]);

    // handle network change
    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCaipId = e.target.value;
        updateFormData('selectedChain', selectedCaipId);
        setSelectedChain(selectedCaipId);

        const selectedChainObj = chains.find(
            (chain) => chain.caipId === selectedCaipId
        );
        setSponsorshipEnabled(selectedChainObj?.sponsorshipEnabled || false);
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const updateTransaction = (index: number, field: string, value: any) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === index ? { ...tx, [field]: value } : tx
        ));
        setError('');
    };

    const addTransaction = () => {
        setTransactions(prev => [...prev, {
            function: '',
            typeArguments: [],
            functionArguments: []
        }]);
    };

    const removeTransaction = (index: number) => {
        if (transactions.length > 1) {
            setTransactions(prev => prev.filter((_, i) => i !== index));
        }
    };

    const addTypeArgument = (txIndex: number) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                typeArguments: [...(tx.typeArguments || []), '']
            } : tx
        ));
    };

    const updateTypeArgument = (txIndex: number, argIndex: number, value: string) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                typeArguments: tx.typeArguments?.map((arg, j) => j === argIndex ? value : arg) || []
            } : tx
        ));
    };

    const removeTypeArgument = (txIndex: number, argIndex: number) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                typeArguments: tx.typeArguments?.filter((_, j) => j !== argIndex) || []
            } : tx
        ));
    };

    const addFunctionArgument = (txIndex: number) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                functionArguments: [...(tx.functionArguments || []), '']
            } : tx
        ));
    };

    const updateFunctionArgument = (txIndex: number, argIndex: number, value: string) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                functionArguments: tx.functionArguments?.map((arg, j) => j === argIndex ? value : arg) || []
            } : tx
        ));
    };

    const removeFunctionArgument = (txIndex: number, argIndex: number) => {
        setTransactions(prev => prev.map((tx, i) =>
            i === txIndex ? {
                ...tx,
                functionArguments: tx.functionArguments?.filter((_, j) => j !== argIndex) || []
            } : tx
        ));
    };

    const validateForm = () => {
        if (!formData.selectedChain) return 'Please select a network';
        if (!formData.fromAddress?.startsWith('0x')) return 'Invalid sender address';

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            if (!tx.function.trim()) return `Transaction ${i + 1}: Function name is required`;
            if (!tx.function.includes('::')) return `Transaction ${i + 1}: Function must be in format "module::function_name"`;
        }
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
            const params: AptosRawTransactionIntentParams = {
                caip2Id: formData.selectedChain,
                transactions: transactions.map(tx => ({
                    function: tx.function,
                    typeArguments: tx.typeArguments?.filter(arg => arg.trim()) || [],
                    functionArguments: tx.functionArguments?.filter(arg => arg !== '') || []
                }))
            };

            const result = await aptosRawTransactionWithEstimate(
                oktoClient,
                params,
                formData.feePayerAddress?.startsWith('0x')
                    ? formData.feePayerAddress as `0x${string}`
                    : undefined
            );

            setEstimate(result.details);
            setUserOp(result.userOp);
            setCurrentStep(2);
        } catch (err) {
            setError(
                err instanceof BaseError
                    ? (err instanceof Error ? err.message : String(err))
                    : err instanceof Error
                        ? err.message
                        : 'Failed to get transaction estimate'
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
                err instanceof BaseError ? err.message : 'Transaction execution failed'
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
            fromAddress: '',
            feePayerAddress: ''
        });
        setTransactions([{
            function: '',
            typeArguments: [],
            functionArguments: []
        }]);
    };

    const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>

                {/* Main Container */}
                <div className="relative bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    {/* Glowing Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 blur-sm"></div>
                    <div className="relative bg-white/95 backdrop-blur-xl m-0.5 rounded-2xl">

                        {/* Header */}
                        <div className="relative p-8 pb-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Cpu className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                                        Raw Aptos Transaction
                                    </h1>
                                    <p className="text-slate-600 text-lg">Execute custom Aptos move functions with precision</p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="flex items-center space-x-4 mt-8">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                                            ${currentStep >= step
                                                ? 'bg-gradient-to-br from-red-500 to-orange-600 border-red-400 text-white shadow-lg shadow-red-500/30'
                                                : 'border-slate-300 text-slate-500 bg-slate-100'}
                                        `}>
                                            {currentStep > step ? <Check size={16} /> : step}
                                        </div>
                                        {step < 3 && (
                                            <div className={`
                                                w-16 h-0.5 mx-2 transition-all duration-300
                                                ${currentStep > step ? 'bg-gradient-to-r from-red-500 to-orange-600' : 'bg-slate-300'}
                                            `}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mx-8 mb-6">
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center backdrop-blur-sm">
                                    <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
                                    <span className="text-red-700">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Transaction Setup */}
                        {currentStep === 1 && (
                            <div className="p-8 pt-0 space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Network Selection */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                            <Shield className="mr-2 text-red-500" size={16} />
                                            Aptos Network
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.selectedChain}
                                                onChange={handleNetworkChange}
                                                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 shadow-sm"
                                            >
                                                <option value="">Select Aptos Network</option>
                                                {chains.map((chain) => (
                                                    <option key={chain.chainId} value={chain.caipId}>
                                                        {chain.networkName}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>

                                    {selectedChain && (
                                        <div className={`mt-2 p-4 rounded-xl border ${sponsorshipEnabled
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-yellow-50 border-yellow-200'
                                            }`}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full flex items-center justify-center ${sponsorshipEnabled
                                                        ? 'bg-green-100'
                                                        : 'bg-yellow-100'
                                                    }`}>
                                                    {sponsorshipEnabled ? (
                                                        <Check className="text-green-600" size={16} />
                                                    ) : (
                                                        <AlertCircle className="text-yellow-600" size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className={`font-medium ${sponsorshipEnabled
                                                            ? 'text-green-700'
                                                            : 'text-yellow-700'
                                                        }`}>
                                                        {sponsorshipEnabled
                                                            ? 'Gas Sponsorship Available'
                                                            : 'Gas Sponsorship Unavailable'}
                                                    </h4>
                                                    <p className={`text-sm mt-1 ${sponsorshipEnabled
                                                            ? 'text-green-600'
                                                            : 'text-yellow-600'
                                                        }`}>
                                                        {sponsorshipEnabled
                                                            ? 'Transactions can be sponsored on this network'
                                                            : 'APT tokens required for transactions. Please obtain tokens from faucets.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fee Payer Address */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                            <Zap className="mr-2 text-yellow-500" size={16} />
                                            Fee Payer Address (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.feePayerAddress}
                                            onChange={(e) => updateFormData('feePayerAddress', e.target.value)}
                                            placeholder="0x..."
                                            className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 shadow-sm font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* From Address */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        From Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fromAddress}
                                        onChange={(e) => updateFormData('fromAddress', e.target.value)}
                                        placeholder="0x..."
                                        className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 shadow-sm font-mono text-sm"
                                    />
                                    {formData.selectedChain && formData.fromAddress && (
                                        <p className="text-sm text-green-600 flex items-center mt-2">
                                            <Check className="mr-1" size={14} />
                                            Auto-filled with your wallet address for this network
                                        </p>
                                    )}
                                </div>

                                {/* Transaction Functions */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-800">Move Functions</h3>
                                        <button
                                            onClick={addTransaction}
                                            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Add Function
                                        </button>
                                    </div>

                                    {transactions.map((transaction, txIndex) => (
                                        <div key={txIndex} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-700">Function {txIndex + 1}</h4>
                                                {transactions.length > 1 && (
                                                    <button
                                                        onClick={() => removeTransaction(txIndex)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Function Name */}
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-slate-600">
                                                    Function Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={transaction.function}
                                                    onChange={(e) => updateTransaction(txIndex, 'function', e.target.value)}
                                                    placeholder="0x1::coin::transfer"
                                                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-sm"
                                                />
                                            </div>

                                            {/* Type Arguments */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-slate-600">
                                                        Type Arguments
                                                    </label>
                                                    <button
                                                        onClick={() => addTypeArgument(txIndex)}
                                                        className="text-red-500 hover:text-red-700 text-sm flex items-center transition-colors duration-200"
                                                    >
                                                        <Plus size={14} className="mr-1" />
                                                        Add Type
                                                    </button>
                                                </div>
                                                {transaction.typeArguments?.map((arg, argIndex) => (
                                                    <div key={argIndex} className="flex items-center space-x-2">
                                                        <input
                                                            type="text"
                                                            value={arg}
                                                            onChange={(e) => updateTypeArgument(txIndex, argIndex, e.target.value)}
                                                            placeholder="0x1::aptos_coin::AptosCoin"
                                                            className="flex-1 p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-sm"
                                                        />
                                                        <button
                                                            onClick={() => removeTypeArgument(txIndex, argIndex)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Function Arguments */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-slate-600">
                                                        Function Arguments
                                                    </label>
                                                    <button
                                                        onClick={() => addFunctionArgument(txIndex)}
                                                        className="text-red-500 hover:text-red-700 text-sm flex items-center transition-colors duration-200"
                                                    >
                                                        <Plus size={14} className="mr-1" />
                                                        Add Argument
                                                    </button>
                                                </div>
                                                {transaction.functionArguments?.map((arg, argIndex) => (
                                                    <div key={argIndex} className="flex items-center space-x-2">
                                                        <input
                                                            type="text"
                                                            value={arg}
                                                            onChange={(e) => updateFunctionArgument(txIndex, argIndex, e.target.value)}
                                                            placeholder="Enter argument value"
                                                            className="flex-1 p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-sm"
                                                        />
                                                        <button
                                                            onClick={() => removeFunctionArgument(txIndex, argIndex)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleGetEstimate}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-slate-400 disabled:to-slate-400 text-white py-4 px-8 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="animate-spin mr-3" size={20} />
                                            Analyzing Transaction...
                                        </>
                                    ) : (
                                        <>
                                            <Cpu className="mr-3" size={20} />
                                            Get Transaction Estimate
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Review & Execute */}
                        {currentStep === 2 && estimate && userOp && (
                            <div className="p-8 pt-0 space-y-8">
                                {/* Transaction Details */}
                                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                        <Shield className="mr-3 text-green-500" size={20} />
                                        Transaction Details
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 text-sm">
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-slate-500">Network:</span>
                                            <span className="text-slate-800 font-semibold">{selectedChainData?.networkName}</span>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-slate-500">From:</span>
                                            <span className="text-slate-800 font-mono text-xs break-all">{formData.fromAddress}</span>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-slate-500">Functions:</span>
                                            <div className="space-y-2">
                                                {transactions.map((tx, index) => (
                                                    <div key={index} className="bg-slate-100 p-3 rounded-lg border">
                                                        <div className="font-mono text-xs text-slate-800 font-semibold mb-2">
                                                            {tx.function}
                                                        </div>
                                                        {tx.typeArguments && tx.typeArguments.length > 0 && (
                                                            <div className="text-xs text-slate-600 mb-1">
                                                                <span className="font-medium">Type Args:</span> {tx.typeArguments.join(', ')}
                                                            </div>
                                                        )}
                                                        {tx.functionArguments && tx.functionArguments.length > 0 && (
                                                            <div className="text-xs text-slate-600">
                                                                <span className="font-medium">Args:</span> {tx.functionArguments.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gas Estimate */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                                <Zap className="mr-3 text-yellow-500" size={20} />
                                                Gas Estimation
                                            </h3>
                                            <button
                                                onClick={() => setShowEstimateDetails(!showEstimateDetails)}
                                                className="text-blue-600 hover:text-blue-700 flex items-center transition-colors duration-200"
                                            >
                                                {showEstimateDetails ? 'Hide' : 'Show'} Details
                                                <ChevronDown className={`ml-2 transform transition-transform duration-200 ${showEstimateDetails ? 'rotate-180' : ''}`} size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                                                <div className="text-sm text-slate-600 mb-2">Estimated Gas Fees</div>
                                                {estimate.fees?.transactionFees && Object.entries(estimate.fees.transactionFees).map(([network, fee]) => (
                                                    <div key={network} className="text-2xl font-bold text-blue-700 mb-1">
                                                        {fee} ETH
                                                    </div>
                                                ))}
                                                {estimate.fees?.approxTransactionFeesInUSDT && (
                                                    <div className="text-sm text-slate-500">
                                                        ≈ ${estimate.fees.approxTransactionFeesInUSDT}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                                <div className="text-sm text-slate-600 mb-2">Total Fees</div>
                                                {estimate.estimation?.totalFeesInInputToken && (
                                                    <div className="text-2xl font-bold text-green-700 mb-1">
                                                        {estimate.estimation.totalFeesInInputToken}
                                                    </div>
                                                )}
                                                {estimate.fees?.approxTransactionFeesInUSDT && (
                                                    <div className="text-sm text-slate-500">
                                                        ≈ ${estimate.fees.approxTransactionFeesInUSDT}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {showEstimateDetails && userOp && (
                                            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                                                    <Cpu className="mr-2 text-purple-600" size={16} />
                                                    User Operation Details
                                                </h4>
                                                <div className="space-y-3 text-sm font-mono">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Call Gas Limit:</span>
                                                        <span className="text-slate-800 bg-white px-3 py-1 rounded border">{userOp.callGasLimit}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Verification Gas:</span>
                                                        <span className="text-slate-800 bg-white px-3 py-1 rounded border">{userOp.verificationGasLimit}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Pre-verification Gas:</span>
                                                        <span className="text-slate-800 bg-white px-3 py-1 rounded border">{userOp.preVerificationGas}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Max Fee Per Gas:</span>
                                                        <span className="text-slate-800 bg-white px-3 py-1 rounded border">{userOp.maxFeePerGas}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Max Priority Fee:</span>
                                                        <span className="text-slate-800 bg-white px-3 py-1 rounded border">{userOp.maxPriorityFeePerGas}</span>
                                                    </div>
                                                    {userOp.paymaster && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-600">Paymaster:</span>
                                                            <span className="text-slate-800 bg-white px-3 py-1 rounded border truncate max-w-fit">{userOp.paymaster}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {estimate.gsn?.isPossible && (
                                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                                <div className="flex items-center text-green-700 mb-2">
                                                    <Shield className="mr-2" size={16} />
                                                    <span className="font-semibold">Gas Station Network Available</span>
                                                </div>
                                                <div className="text-sm text-green-600">
                                                    This transaction can be sponsored using GSN
                                                </div>
                                                {estimate.gsn.isRequired && (
                                                    <div className="text-sm text-orange-600 mt-2 flex items-center">
                                                        <AlertCircle className="mr-1" size={14} />
                                                        GSN sponsorship is required for this transaction
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 px-6 rounded-xl font-semibold transition-all duration-200"
                                    >
                                        Back to Edit
                                    </button>
                                    <button
                                        onClick={handleExecuteTransaction}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="animate-spin mr-3" size={20} />
                                                Executing Transaction...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-3" size={20} />
                                                Execute Transaction
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Transaction Complete */}
                        {currentStep === 3 && jobId && (
                            <div className="p-8 pt-0 text-center space-y-8">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/40">
                                        <Check className="text-white" size={48} />
                                    </div>
                                    <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto animate-ping opacity-20"></div>
                                </div>

                                <div>
                                    <h3 className="text-3xl font-bold text-slate-800 mb-4">Transaction Submitted Successfully!</h3>
                                    <p className="text-slate-600 text-lg">Your raw transaction has been broadcast to the blockchain network.</p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                                    <div className="text-sm text-slate-500 mb-3 flex items-center justify-center">
                                        <Cpu className="mr-2" size={16} />
                                        Transaction ID
                                    </div>
                                    <div className="flex items-center justify-center space-x-3">
                                        <code className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-mono text-sm text-slate-800 break-all">
                                            {jobId}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(jobId)}
                                            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                                    <button
                                        onClick={resetTransaction}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                                    >
                                        Create New Transaction
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-200"
                                    >
                                        View on Explorer
                                        <ExternalLink className="ml-2" size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AptosRawTransactionEstimate;