import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, RefreshCw, Check, AlertCircle, Copy, ExternalLink, Palette, Plus } from 'lucide-react';
import { getChains, getPortfolio, GetSupportedNetworksResponseData, useOkto, UserOp, UserPortfolioData } from '@okto_web3/react-sdk';
import { nftMintWithEstimate, NftMintParams } from '@okto_web3/react-sdk/userop';

// Types based on the nftMintWithEstimate function
type NftMintFormData = {
    selectedChain: string;
    nftName: string;
    collectionAddress: string;
    uri: string;
    recipientWalletAddress: string;
    description: string;
    properties: Array<{ key: string; value: string }>;
    feePayerAddress: string;
};

type EstimateDetails = {
    estimatedGasCost: string;
    estimatedGasCostUsd: string;
    totalCost: string;
    totalCostUsd: string;
    gsn?: {
        isPossible: boolean;
        isRequired: boolean;
        requiredNetworks: string[];
        tokens: string[];
    };
};

const NFTMintEstimate = () => {
    const oktoClient = useOkto();

    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [chains, setChains] = useState<GetSupportedNetworksResponseData[]>([]);
    const [portfolio, setPortfolio] = useState<UserPortfolioData | null>(null);

    const [formData, setFormData] = useState<NftMintFormData>({
        selectedChain: '',
        nftName: '',
        collectionAddress: '',
        uri: '',
        recipientWalletAddress: '',
        description: '',
        properties: [],
        feePayerAddress: ''
    });

    const [estimate, setEstimate] = useState<EstimateDetails | null>(null);
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

    const updateFormData = (field: keyof NftMintFormData, value: string | Array<{ key: string; value: string }>) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const addProperty = () => {
        setFormData(prev => ({
            ...prev,
            properties: [...prev.properties, { key: '', value: '' }]
        }));
    };

    const updateProperty = (index: number, field: 'key' | 'value', value: string) => {
        const newProperties = [...formData.properties];
        newProperties[index][field] = value;
        updateFormData('properties', newProperties);
    };

    const removeProperty = (index: number) => {
        const newProperties = formData.properties.filter((_, i) => i !== index);
        updateFormData('properties', newProperties);
    };

    const validateForm = () => {
        if (!formData.selectedChain) return 'Please select a network';
        if (!formData.nftName.trim()) return 'Please enter an NFT name';
        if (!formData.uri.trim()) return 'Please enter a valid URI';
        if (!formData.recipientWalletAddress) {
            return 'Please enter a valid recipient address';
        }
        
        // Check if selected chain is Aptos
        const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);
        if (selectedChainData && !selectedChainData.caipId.toLowerCase().startsWith('aptos:')) {
            return 'NFT Minting is only supported on Aptos chain';
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
            const params: NftMintParams = {
                caip2Id: formData.selectedChain,
                collectionAddress: formData.collectionAddress,
                nftName: formData.nftName,
                uri: formData.uri,
                data: {
                    recipientWalletAddress: formData.recipientWalletAddress,
                    description: formData.description,
                    properties: formData.properties.map(prop => ({
                        name: prop.key,
                        type: 1,
                        value: prop.value
                    }))
                }
            };

            const result = await nftMintWithEstimate(
                oktoClient,
                params,
                formData.feePayerAddress && formData.feePayerAddress.startsWith('0x')
                    ? formData.feePayerAddress as `0x${string}`
                    : undefined
            );
            
            setEstimate(result.details as EstimateDetails);
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
            nftName: '',
            collectionAddress: '',
            uri: '',
            recipientWalletAddress: '',
            description: '',
            properties: [],
            feePayerAddress: ''
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);
    const aptosChains = chains.filter(c => c.caipId.toLowerCase().startsWith('aptos:'));

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center mb-2">
                    <Palette className="text-purple-600 mr-3" size={32} />
                    <h1 className="text-3xl font-bold text-gray-900">NFT Mint</h1>
                </div>
                <p className="text-gray-600">Create and mint new NFTs on Aptos blockchain with gas estimation</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 1 ? <Check size={16} /> : '1'}
                    </div>
                    <span className="ml-2 font-medium">Setup NFT</span>
                </div>

                <ArrowRight className="text-gray-400" size={20} />

                <div className={`flex items-center ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 2 ? <Check size={16} /> : '2'}
                    </div>
                    <span className="ml-2 font-medium">Review & Mint</span>
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

            {/* Step 1: NFT Setup */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    {/* Network Selection - Only Aptos chains */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Network (Aptos Only)
                        </label>
                        <div className="relative">
                            <select
                                value={formData.selectedChain}
                                onChange={(e) => updateFormData('selectedChain', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Select Aptos Network</option>
                                {aptosChains.map((chain) => (
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
                        {aptosChains.length === 0 && (
                            <div className="mt-2 p-2 rounded text-sm bg-orange-50 text-orange-800">
                                ⚠️ No Aptos networks available. NFT minting is only supported on Aptos blockchain.
                            </div>
                        )}
                    </div>

                    {/* NFT Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NFT Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nftName}
                                onChange={(e) => updateFormData('nftName', e.target.value)}
                                placeholder="Enter NFT name"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collection Address (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.collectionAddress}
                                onChange={(e) => updateFormData('collectionAddress', e.target.value)}
                                placeholder="0x... (leave empty for new collection)"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* URI and Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Metadata URI <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.uri}
                            onChange={(e) => updateFormData('uri', e.target.value)}
                            placeholder="https://example.com/metadata.json"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="mt-1 text-sm text-gray-500">
                            URL pointing to the NFT&apos;s metadata JSON file
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => updateFormData('description', e.target.value)}
                            placeholder="Describe your NFT..."
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Recipient Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipient Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.recipientWalletAddress}
                            onChange={(e) => updateFormData('recipientWalletAddress', e.target.value)}
                            placeholder="0x..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Custom Properties */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Custom Properties
                            </label>
                            <button
                                type="button"
                                onClick={addProperty}
                                className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                            >
                                <Plus size={16} className="mr-1" />
                                Add Property
                            </button>
                        </div>
                        
                        {formData.properties.map((property, index) => (
                            <div key={index} className="flex gap-3 mb-3">
                                <input
                                    type="text"
                                    value={property.key}
                                    onChange={(e) => updateProperty(index, 'key', e.target.value)}
                                    placeholder="Property name"
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <input
                                    type="text"
                                    value={property.value}
                                    onChange={(e) => updateProperty(index, 'value', e.target.value)}
                                    placeholder="Property value"
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeProperty(index)}
                                    className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        
                        {formData.properties.length === 0 && (
                            <div className="text-sm text-gray-500 italic">
                                No custom properties added. Click &quot;Add Property&quot; to include additional metadata.
                            </div>
                        )}
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Get Estimate Button */}
                    <button
                        onClick={handleGetEstimate}
                        disabled={loading || aptosChains.length === 0}
                        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={20} />
                                Getting Estimate...
                            </>
                        ) : (
                            'Get Mint Estimate'
                        )}
                    </button>
                </div>
            )}

            {/* Step 2: Review & Execute */}
            {currentStep === 2 && estimate && (
                <div className="space-y-6">
                    {/* NFT Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">NFT Mint Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Network:</span>
                                <span className="ml-2 font-medium">{selectedChainData?.networkName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">NFT Name:</span>
                                <span className="ml-2 font-medium">{formData.nftName}</span>
                            </div>
                            {formData.collectionAddress && (
                                <div className="md:col-span-2">
                                    <span className="text-gray-600">Collection:</span>
                                    <span className="ml-2 font-medium font-mono text-xs">{formData.collectionAddress}</span>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Metadata URI:</span>
                                <span className="ml-2 font-medium break-all">{formData.uri}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Recipient:</span>
                                <span className="ml-2 font-medium font-mono text-xs">{formData.recipientWalletAddress}</span>
                            </div>
                            {formData.description && (
                                <div className="md:col-span-2">
                                    <span className="text-gray-600">Description:</span>
                                    <span className="ml-2 font-medium">{formData.description}</span>
                                </div>
                            )}
                            {formData.properties.length > 0 && (
                                <div className="md:col-span-2">
                                    <span className="text-gray-600">Properties:</span>
                                    <div className="ml-2 mt-1 space-y-1">
                                        {formData.properties.map((prop, index) => (
                                            <div key={index} className="text-sm">
                                                <span className="font-medium">{prop.key}:</span> {prop.value}
                                            </div>
                                        ))}
                                    </div>
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
                                className="text-purple-600 hover:text-purple-700 flex items-center"
                            >
                                {showEstimateDetails ? 'Hide' : 'Show'} Details
                                <ChevronDown className={`ml-1 transform ${showEstimateDetails ? 'rotate-180' : ''}`} size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Estimated Gas Cost</div>
                                <div className="text-xl font-bold text-purple-600">{estimate.estimatedGasCost} APT</div>
                                <div className="text-sm text-gray-500">${estimate.estimatedGasCostUsd}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Total Cost</div>
                                <div className="text-xl font-bold text-green-600">{estimate.totalCost} APT</div>
                                <div className="text-sm text-gray-500">${estimate.totalCostUsd}</div>
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
                                    Minting...
                                </>
                            ) : (
                                'Mint NFT'
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">NFT Mint Submitted!</h3>
                        <p className="text-gray-600">Your NFT has been successfully submitted for minting on the Aptos blockchain.</p>
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

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-800">
                            <strong>NFT Details:</strong>
                        </div>
                        <div className="text-sm text-blue-700 mt-2">
                            <div><strong>Name:</strong> {formData.nftName}</div>
                            <div><strong>Recipient:</strong> {formData.recipientWalletAddress}</div>
                            <div><strong>Network:</strong> {selectedChainData?.networkName}</div>
                        </div>
                    </div>

                    <div className="flex space-x-4 justify-center">
                        <button
                            onClick={resetTransaction}
                            className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700"
                        >
                            Mint Another NFT
                        </button>
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 flex items-center"
                        >
                            View on Explorer
                            <ExternalLink className="ml-2" size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NFTMintEstimate;