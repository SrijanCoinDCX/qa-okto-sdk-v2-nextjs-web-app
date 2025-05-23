'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, RefreshCw, Check, AlertCircle, Copy, ExternalLink, Info } from 'lucide-react'
import { useOkto, getChains, getPortfolio, EstimationDetails, UserOp } from '@okto_web3/react-sdk';
import {nftCreateCollectionWithEstimate, NftCreateCollectionParams} from '@okto_web3/react-sdk/userop';

const NFTCollectionCreationEstimate = () => {
    const oktoClient = useOkto();

    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [chains, setChains] = useState<any[]>([]);
    const [portfolio, setPortfolio] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const chainsData = await getChains(oktoClient);
            const portfolioData = await getPortfolio(oktoClient);
            setChains(chainsData);
            setPortfolio(portfolioData);
        };
        fetchData();
    }, [oktoClient]);

    const [formData, setFormData] = useState({
        selectedChain: '',
        name: '',
        uri: '',
        symbol: '',
        description: '',
        feePayerAddress: '',
        attributes: ''
    });

    const [estimate, setEstimate] = useState<EstimationDetails | null>(null);
    const [userOp, setUserOp] = useState<UserOp | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEstimateDetails, setShowEstimateDetails] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Enhanced validation with detailed error messages
    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!formData.selectedChain) {
            errors.selectedChain = 'Please select a network';
        } else if (!formData.selectedChain.toLowerCase().startsWith('aptos:')) {
            errors.selectedChain = 'Only Aptos networks are supported for NFT collection creation';
        }
        
        if (!formData.name.trim()) {
            errors.name = 'Collection name is required';
        } else if (formData.name.length < 3) {
            errors.name = 'Collection name must be at least 3 characters';
        }
        
        if (!formData.uri.trim()) {
            errors.uri = 'Metadata URI is required';
        } else {
            try {
                new URL(formData.uri);
            } catch {
                errors.uri = 'Please enter a valid URI';
            }
        }

        if (formData.symbol && formData.symbol.length > 10) {
            errors.symbol = 'Symbol should be 10 characters or less';
        }

        if (formData.feePayerAddress && !formData.feePayerAddress.startsWith('0x')) {
            errors.feePayerAddress = 'Fee payer address must be a valid hex address starting with 0x';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
        // Clear specific field validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleGetEstimate = async () => {
        if (!validateForm()) {
            return;
        }

        if (!oktoClient.isLoggedIn()) {
            setError('Please log in to continue');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Prepare parameters for NFT collection creation
            const params: NftCreateCollectionParams = {
                caip2Id: formData.selectedChain,
                name: formData.name.trim(),
                uri: formData.uri.trim(),
                data: {
                    symbol: formData.symbol.trim() || undefined,
                    description: formData.description.trim() || undefined,
                    attributes: formData.attributes.trim() || undefined
                }
            };

            // Remove undefined or empty values from data object
            (Object.keys(params.data) as Array<keyof typeof params.data>).forEach(key => {
                if (!params.data[key]) {
                    delete params.data[key];
                }
            });

            // Call the actual SDK function
            const result = await nftCreateCollectionWithEstimate(
                oktoClient,
                params,
                formData.feePayerAddress && formData.feePayerAddress.startsWith('0x')
                    ? formData.feePayerAddress as `0x${string}`
                    : undefined
            );

            setEstimate(result.details);
            setUserOp(result.userOp);
            setCurrentStep(2);
        } catch (err) {
            console.error('Estimation error:', err);
            if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string') {
                if ((err as any).message.includes('Chain Not Supported')) {
                    setError('Selected network is not supported. Please choose an Aptos network.');
                } else if ((err as any).message.includes('User not logged in')) {
                    setError('Please log in to continue with the transaction.');
                } else {
                    setError((err as any).message);
                }
            } else {
                setError('Failed to get estimate. Please try again.');
            }
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
        setValidationErrors({});
        setFormData({
            selectedChain: '',
            name: '',
            uri: '',
            symbol: '',
            description: '',
            feePayerAddress: '',
            attributes: ''
        });
    };

    const selectedChainData =  ((chains)).find(c => c.caipId === formData.selectedChain);
    const isAptosChain = formData.selectedChain?.toLowerCase().startsWith('aptos:');

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create NFT Collection</h1>
                <p className="text-gray-600">Deploy new NFT collection with gas estimation on Aptos network</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 1 ? <Check size={16} /> : '1'}
                    </div>
                    <span className="ml-2 font-medium">Setup Collection</span>
                </div>

                <ArrowRight className="text-gray-400" size={20} />

                <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 2 ? <Check size={16} /> : '2'}
                    </div>
                    <span className="ml-2 font-medium">Review & Deploy</span>
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
                    <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
                    <span className="text-red-800">{error}</span>
                </div>
            )}

            {/* Step 1: Collection Setup */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    {/* Network Selection with Aptos-only notice */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Network *
                        </label>
                        <div className="relative">
                            <select
                                value={formData.selectedChain}
                                onChange={(e) => updateFormData('selectedChain', e.target.value)}
                                className={`w-full p-3 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    validationErrors.selectedChain ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select Aptos Network</option>
                                {((chains))
                                    .filter(chain => chain.caipId.toLowerCase().startsWith('aptos:'))
                                    .map((chain) => (
                                        <option key={chain.chainId} value={chain.caipId}>
                                            {chain.networkName}
                                        </option>
                                    ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={20} />
                        </div>
                        {validationErrors.selectedChain && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.selectedChain}</p>
                        )}
                        <div className="mt-2 flex items-start space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                            <Info size={16} className="flex-shrink-0 mt-0.5" />
                            <span>NFT collection creation is currently only supported on Aptos networks.</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Collection Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collection Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                placeholder="My Awesome Collection"
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {validationErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                            )}
                        </div>

                        {/* Symbol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Symbol
                            </label>
                            <input
                                type="text"
                                value={formData.symbol}
                                onChange={(e) => updateFormData('symbol', e.target.value.toUpperCase())}
                                placeholder="AWESOME"
                                maxLength={10}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    validationErrors.symbol ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {validationErrors.symbol && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.symbol}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">Optional, max 10 characters</p>
                        </div>
                    </div>

                    {/* Metadata URI */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Metadata URI *
                        </label>
                        <input
                            type="url"
                            value={formData.uri}
                            onChange={(e) => updateFormData('uri', e.target.value)}
                            placeholder="https://example.com/metadata.json"
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                validationErrors.uri ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {validationErrors.uri && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.uri}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">Link to collection metadata JSON</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => updateFormData('description', e.target.value)}
                            placeholder="Describe your collection..."
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">Optional description for your collection</p>
                    </div>

                    {/* Fee Payer Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fee Payer Address
                        </label>
                        <input
                            type="text"
                            value={formData.feePayerAddress}
                            onChange={(e) => updateFormData('feePayerAddress', e.target.value)}
                            placeholder="0x... (leave empty to use default)"
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                validationErrors.feePayerAddress ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {validationErrors.feePayerAddress && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.feePayerAddress}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">Optional sponsor address for gas fees</p>
                    </div>

                    {/* Additional Attributes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Attributes
                        </label>
                        <textarea
                            value={formData.attributes}
                            onChange={(e) => updateFormData('attributes', e.target.value)}
                            placeholder='{"trait_type": "value", ...}'
                            rows={2}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <p className="mt-1 text-sm text-gray-500">Optional JSON attributes for the collection</p>
                    </div>

                    <button
                        onClick={handleGetEstimate}
                        disabled={loading || !oktoClient.isLoggedIn()}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={20} />
                                Getting Estimate...
                            </>
                        ) : (
                            'Get Creation Estimate'
                        )}
                    </button>
                </div>
            )}

            {/* Step 2: Review & Execute */}
            {currentStep === 2 && estimate && (
                <div className="space-y-6">
                    {/* Collection Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Collection Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Network:</span>
                                <span className="ml-2 font-medium">{selectedChainData?.networkName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Name:</span>
                                <span className="ml-2 font-medium">{formData.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Symbol:</span>
                                <span className="ml-2 font-medium">{formData.symbol || 'N/A'}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Metadata URI:</span>
                                <span className="ml-2 font-medium break-all">{formData.uri}</span>
                            </div>
                            {formData.description && (
                                <div className="md:col-span-2">
                                    <span className="text-gray-600">Description:</span>
                                    <span className="ml-2 font-medium">{formData.description}</span>
                                </div>
                            )}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Estimated Gas Cost</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {estimate.fees?.transactionFees?.[formData.selectedChain] ?? '--'} APT
                                </div>
                                <div className="text-sm text-gray-500">
                                    ${estimate.fees?.approxTransactionFeesInUSDT ?? '--'}
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Total Cost</div>
                                <div className="text-xl font-bold text-green-600">
                                    {estimate.fees?.transactionFees?.[formData.selectedChain] ?? '--'} APT
                                </div>
                                <div className="text-sm text-gray-500">
                                    ${estimate.fees?.approxTransactionFeesInUSDT ?? '--'}
                                </div>
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
                                            <span className="truncate max-w-32">{userOp.paymaster}</span>
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
                                    Deploying Collection...
                                </>
                            ) : (
                                'Deploy Collection'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Completion */}
            {currentStep === 3 && jobId && (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="text-green-600" size={40} />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Collection Deployed Successfully!</h3>
                        <p className="text-gray-600">Your NFT collection has been deployed to {selectedChainData?.networkName}.</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Job ID</div>
                        <div className="flex items-center justify-center space-x-2">
                            <code className="bg-white px-3 py-2 rounded border font-mono text-sm">{jobId}</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(jobId)}
                                className="p-2 text-gray-500 hover:text-gray-700"
                                title="Copy to clipboard"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center">
                        <button
                            onClick={resetTransaction}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700"
                        >
                            Create Another Collection
                        </button>
                        <button 
                            onClick={() => window.open('https://explorer.aptoslabs.com', '_blank')} 
                            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center"
                        >
                            View on Explorer
                            <ExternalLink className="ml-2" size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NFTCollectionCreationEstimate;