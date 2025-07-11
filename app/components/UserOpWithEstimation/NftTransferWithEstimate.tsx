import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, RefreshCw, Check, AlertCircle, Copy, ExternalLink, Image } from 'lucide-react';
import { getChains, getPortfolioNFT, GetSupportedNetworksResponseData, useOkto, UserOp } from '@okto_web3/react-sdk';
import { NFTTransferIntentParams, nftTransferWithEstimate } from '@okto_web3/react-sdk/userop';

// Types
type NFTData = {
    address: string;
    nft_id: string;
    nft_type: string;
    caipId: string;
    name: string;
    image: string;
    quantity: string;
};

type NFTTransferFormData = {
    selectedChain: string;
    selectedNFT: string;
    collectionAddress: string;
    nftId: string;
    recipientWalletAddress: string;
    amount: number | string;
    nftType: string | null;  // Explicitly nullable
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

const NFTTransferEstimate = () => {
    const oktoClient = useOkto();

    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [chains, setChains] = useState<GetSupportedNetworksResponseData[]>([]);
    const [nftPortfolio, setNftPortfolio] = useState<NFTData[]>([]);
    const [filteredNFTs, setFilteredNFTs] = useState<NFTData[]>([]);

    const [formData, setFormData] = useState<NFTTransferFormData>({
        selectedChain: '',
        selectedNFT: '',
        collectionAddress: '',
        nftId: '',
        recipientWalletAddress: '',
        amount: '1',
        nftType: null,  // Initialized as null
        feePayerAddress: ''
    });

    const [estimate, setEstimate] = useState<EstimateDetails | null>(null);
    const [userOp, setUserOp] = useState<UserOp | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingNFTs, setLoadingNFTs] = useState(false);
    const [error, setError] = useState('');
    const [showEstimateDetails, setShowEstimateDetails] = useState(false);
    const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [chainsData, nftData] = await Promise.all([
                    getChains(oktoClient),
                    getPortfolioNFT(oktoClient)
                ]);
                
                setChains(chainsData);
                
                // Process NFT data
                const processedNfts = nftData.map((nft) => ({
                    address: nft.collectionAddress,
                    nft_id: nft.nftId,
                    nft_type: nft.entityType,
                    caipId: nft.caipId,
                    name: nft.nftName,
                    image: nft.image,
                    quantity: nft.quantity,
                }));
                
                setNftPortfolio(processedNfts);
            } catch (err) {
                setError('Failed to fetch initial data');
            }
        };
        fetchInitialData();
    }, [oktoClient]);

    // Update sponsorship when chain changes
    useEffect(() => {
        const chain = chains.find(c => c.caipId === formData.selectedChain);
        setSponsorshipEnabled(chain?.sponsorshipEnabled || false);
    }, [formData.selectedChain, chains]);

    // Filter NFTs when chain is selected
    useEffect(() => {
        if (!formData.selectedChain) {
            setFilteredNFTs([]);
            return;
        }

        setLoadingNFTs(true);
        
        const filtered = nftPortfolio.filter(nft => nft.caipId === formData.selectedChain);
        setFilteredNFTs(filtered);
        
        // Reset NFT selection when chain changes
        setFormData(prev => ({
            ...prev,
            selectedNFT: '',
            collectionAddress: '',
            nftId: '',
            nftType: null,
            amount: '1'
        }));
        
        setLoadingNFTs(false);
    }, [formData.selectedChain, nftPortfolio]);

    const updateFormData = (field: keyof NFTTransferFormData, value: string | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleChainChange = (chainCaipId: string) => {
        updateFormData('selectedChain', chainCaipId);
    };

    const handleNFTSelection = (selectedValue: string) => {
        updateFormData('selectedNFT', selectedValue);
        
        if (!selectedValue) {
            // Reset all NFT-related fields
            updateFormData('collectionAddress', '');
            updateFormData('nftId', '');
            updateFormData('nftType', null);
            updateFormData('amount', '1');
            return;
        }

        const [selectedAddress, selectedNftId] = selectedValue.split('-');
        const selectedNft = filteredNFTs.find(
            (nft) => nft.address === selectedAddress && nft.nft_id === selectedNftId
        );

        if (selectedNft) {
            updateFormData('collectionAddress', selectedNft.address);
            updateFormData('nftId', selectedNft.nft_id);
            updateFormData('nftType', selectedNft.nft_type || 'ERC721');
            
            // Set amount based on NFT type
            if (selectedNft.nft_type === 'ERC721') {
                updateFormData('amount', '1');
            } else {
                updateFormData('amount', Math.min(parseFloat(selectedNft.quantity), 1).toString());
            }
        }
    };

    const validateForm = () => {
        if (!formData.selectedChain) return 'Please select a network';
        if (!formData.collectionAddress) return 'Please enter a valid collection address';
        if (!formData.recipientWalletAddress) return 'Please enter a valid recipient address';
        if (!formData.amount) return 'Please enter a valid amount';
        
        // NFT ID is required regardless of type
        if (!formData.nftId) return 'NFT ID is required';
        
        // If type is specified, validate based on type
        if (formData.nftType === 'ERC721' && Number(formData.amount) !== 1) {
            return 'Amount must be 1 for ERC721 NFTs';
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
            const params: NFTTransferIntentParams = {
                caip2Id: formData.selectedChain,
                collectionAddress: formData.collectionAddress as `0x${string}`,
                nftId: formData.nftId,
                recipientWalletAddress: formData.recipientWalletAddress as `0x${string}`,
                amount: Number(formData.amount),
                nftType: formData.nftType && formData.nftType !== '' ? (formData.nftType as 'ERC721' | 'ERC1155') : undefined
            };

            const result = await nftTransferWithEstimate(
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
            selectedNFT: '',
            collectionAddress: '',
            nftId: '',
            recipientWalletAddress: '',
            amount: '1',
            nftType: null,
            feePayerAddress: ''
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);
    const selectedNFTData = filteredNFTs.find(nft => 
        `${nft.address}-${nft.nft_id}` === formData.selectedNFT
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center mb-2">
                    <Image className="text-purple-600 mr-3" size={32} />
                    <h1 className="text-3xl font-bold text-gray-900">NFT Transfer with Estimate</h1>
                </div>
                <p className="text-gray-600">Transfer NFTs with automatic portfolio detection and gas estimation</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                        {currentStep > 1 ? <Check size={16} /> : '1'}
                    </div>
                    <span className="ml-2 font-medium">Setup Transfer</span>
                </div>

                <ArrowRight className="text-gray-400" size={20} />

                <div className={`flex items-center ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
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
                    {/* Network Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Network
                        </label>
                        <div className="relative">
                            <select
                                value={formData.selectedChain}
                                onChange={(e) => handleChainChange(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            <div className={`mt-2 p-2 rounded text-sm ${sponsorshipEnabled ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                                {sponsorshipEnabled ? '✅ Gas sponsorship available' : '⚠️ Gas sponsorship not available'}
                            </div>
                        )}
                    </div>

                    {/* NFT Selection */}
                    {formData.selectedChain && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select NFT from Your Portfolio
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.selectedNFT}
                                    onChange={(e) => handleNFTSelection(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={loadingNFTs}
                                >
                                    <option value="">
                                        {loadingNFTs ? 'Loading NFTs...' : 'Select an NFT or enter details manually'}
                                    </option>
                                    {filteredNFTs.map((nft) => (
                                        <option
                                            key={`${nft.address}-${nft.nft_id}`}
                                            value={`${nft.address}-${nft.nft_id}`}
                                        >
                                            {nft.name || `NFT #${nft.nft_id}`} ({nft.nft_type}) - Qty: {nft.quantity}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400" size={20} />
                            </div>
                            {filteredNFTs.length === 0 && !loadingNFTs && formData.selectedChain && (
                                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded text-sm">
                                    No NFTs found for this network. You can enter details manually below.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Show selected NFT preview */}
                    {selectedNFTData && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-900 mb-2">Selected NFT</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-700">Name:</span>
                                    <span className="ml-2 font-medium">{selectedNFTData.name || 'Unnamed NFT'}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Type:</span>
                                    <span className="ml-2 font-medium">{selectedNFTData.nft_type}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">ID:</span>
                                    <span className="ml-2 font-medium">{selectedNFTData.nft_id}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Available:</span>
                                    <span className="ml-2 font-medium">{selectedNFTData.quantity}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual Entry Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {formData.selectedNFT ? 'Or Override NFT Details' : 'Manual NFT Details'}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Collection Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Collection Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.collectionAddress}
                                    onChange={(e) => updateFormData('collectionAddress', e.target.value)}
                                    placeholder="0x..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* NFT Type (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NFT Type (Optional)
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.nftType || ''}
                                        onChange={(e) => updateFormData('nftType', e.target.value || null)}
                                        className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Not specified</option>
                                        <option value="ERC721">ERC721 (Unique NFTs)</option>
                                        <option value="ERC1155">ERC1155 (Multi-token)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 text-gray-400" size={20} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Helps optimize transaction. Not required for estimation.
                                </p>
                            </div>

                            {/* NFT ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NFT ID (Required)
                                </label>
                                <input
                                    type="text"
                                    value={formData.nftId}
                                    onChange={(e) => updateFormData('nftId', e.target.value)}
                                    placeholder="Enter NFT ID"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => updateFormData('amount', e.target.value)}
                                    placeholder="1"
                                    min="1"
                                    max={selectedNFTData ? selectedNFTData.quantity : undefined}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <div className="mt-1 text-sm text-gray-500">
                                    {formData.nftType === 'ERC721' 
                                        ? 'Always 1 for ERC721' 
                                        : selectedNFTData 
                                            ? `Max: ${selectedNFTData.quantity}` 
                                            : 'Quantity for ERC1155'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recipient Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={formData.recipientWalletAddress}
                            onChange={(e) => updateFormData('recipientWalletAddress', e.target.value)}
                            placeholder="0x..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Get Estimate Button */}
                    <button
                        onClick={handleGetEstimate}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Network:</span>
                                <span className="ml-2 font-medium">{selectedChainData?.networkName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">NFT Type:</span>
                                <span className="ml-2 font-medium">{formData.nftType || 'Not specified'}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Collection:</span>
                                <span className="ml-2 font-medium font-mono text-xs">{formData.collectionAddress}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">NFT ID:</span>
                                <span className="ml-2 font-medium">{formData.nftId}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Amount:</span>
                                <span className="ml-2 font-medium">{formData.amount}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Recipient:</span>
                                <span className="ml-2 font-medium font-mono text-xs">{formData.recipientWalletAddress}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Fee Payer:</span>
                                <span className="ml-2 font-medium font-mono text-xs">
                                    {formData.feePayerAddress || 'Default (User)'}
                                </span>
                            </div>
                        </div>
                    </div>

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
                                <div className="text-xl font-bold text-purple-600">{estimate.estimatedGasCost} ETH</div>
                                <div className="text-sm text-gray-500">${estimate.estimatedGasCostUsd}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Total Cost</div>
                                <div className="text-xl font-bold text-green-600">{estimate.totalCost} ETH</div>
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
                                    Execute Transaction
                                </>
                            ) : (
                                'Confirm Transfer'
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">NFT Transfer Submitted!</h3>
                        <p className="text-gray-600">Your NFT transfer has been successfully submitted to the network.</p>
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
                            className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700"
                        >
                            Transfer Another NFT
                        </button>
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 flex items-center"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NFTTransferEstimate;