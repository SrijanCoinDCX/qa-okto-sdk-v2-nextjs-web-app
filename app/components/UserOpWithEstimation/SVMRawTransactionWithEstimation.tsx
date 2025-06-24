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
  SolanaRawTransactionIntentParams,
  svmRawTransactionWithEstimate
} from '@okto_web3/react-sdk/userop';
import { BaseError } from 'viem';
import TransactionStatusModal from '../utils/TransactionStatusModal';

interface SolanaInstruction {
  programId: string;
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: number[]; // Changed to number array
}

interface SolanaTransaction {
  instructions: SolanaInstruction[];
  signers?: string[];
}

const SolanaRawTransactionEstimate = () => {
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
    feePayerAddress: '',       // SVM fee payer (Ethereum address)
    solanaFeePayerAddress: ''  // Solana fee payer (base58 address)
  });
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [transactions, setTransactions] = useState<SolanaTransaction[]>([{
    instructions: [{
      programId: '',
      keys: [],
      data: [] // Initialize as empty array
    }],
    signers: []
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
        // Filter only Solana chains
        const solanaChains = chainsData.filter(chain =>
          chain.caipId.toLowerCase().startsWith('solana:')
        );
        setChains(solanaChains);
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
      instructions: [{
        programId: '',
        keys: [],
        data: [] // Initialize as empty array
      }],
      signers: []
    }]);
  };

  const removeTransaction = (index: number) => {
    if (transactions.length > 1) {
      setTransactions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addInstruction = (txIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: [...tx.instructions, {
          programId: '',
          keys: [],
          data: [] // Initialize as empty array
        }]
      } : tx
    ));
  };

  const updateInstruction = (txIndex: number, instIndex: number, field: string, value: any) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: tx.instructions.map((inst, j) =>
          j === instIndex ? { ...inst, [field]: value } : inst
        )
      } : tx
    ));
  };

  const removeInstruction = (txIndex: number, instIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: tx.instructions.filter((_, j) => j !== instIndex)
      } : tx
    ));
  };

  const addAccountKey = (txIndex: number, instIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: tx.instructions.map((inst, j) =>
          j === instIndex ? {
            ...inst,
            keys: [...inst.keys, { pubkey: '', isSigner: false, isWritable: false }]
          } : inst
        )
      } : tx
    ));
  };

  const updateAccountKey = (txIndex: number, instIndex: number, keyIndex: number, field: string, value: any) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: tx.instructions.map((inst, j) =>
          j === instIndex ? {
            ...inst,
            keys: inst.keys.map((key, k) =>
              k === keyIndex ? { ...key, [field]: value } : key
            )
          } : inst
        )
      } : tx
    ));
  };

  const removeAccountKey = (txIndex: number, instIndex: number, keyIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        instructions: tx.instructions.map((inst, j) =>
          j === instIndex ? {
            ...inst,
            keys: inst.keys.filter((_, k) => k !== keyIndex)
          } : inst
        )
      } : tx
    ));
  };

  const addSigner = (txIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        signers: [...(tx.signers || []), '']
      } : tx
    ));
  };

  const updateSigner = (txIndex: number, signerIndex: number, value: string) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        signers: tx.signers?.map((signer, j) => j === signerIndex ? value : signer) || []
      } : tx
    ));
  };

  const removeSigner = (txIndex: number, signerIndex: number) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === txIndex ? {
        ...tx,
        signers: tx.signers?.filter((_, j) => j !== signerIndex) || []
      } : tx
    ));
  };

  // Helper to update instruction data
  const updateInstructionData = (txIndex: number, instIndex: number, value: string) => {
    // Parse comma-separated string to number array
    const byteArray = value.split(',')
      .map(item => parseInt(item.trim()))
      .filter(num => !isNaN(num) && num >= 0 && num <= 255);

    updateInstruction(txIndex, instIndex, 'data', byteArray);
  };

  // Format data array for display
  const formatDataArray = (data: number[]): string => {
    return data.join(', ');
  };

  // Convert data array to base64 for display
  const dataToBase64 = (data: number[]): string => {
    if (!data || data.length === 0) return '';
    const binaryString = String.fromCharCode(...data);
    return btoa(binaryString);
  };

  const validateForm = () => {
    if (!formData.selectedChain) return 'Please select a network';
    // if (!formData.feePayerAddress) return 'SVM fee payer address is required';
    if (!formData.solanaFeePayerAddress) return 'Solana fee payer address is required';
    if (!formData.fromAddress) return 'Invalid sender address';

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.instructions || tx.instructions.length === 0) {
        return `Transaction ${i + 1}: At least one instruction is required`;
      }

      for (let j = 0; j < tx.instructions.length; j++) {
        const inst = tx.instructions[j];
        if (!inst.programId.trim()) {
          return `Transaction ${i + 1}, Instruction ${j + 1}: Program ID is required`;
        }
        if (!inst.data || inst.data.length === 0) {
          return `Transaction ${i + 1}, Instruction ${j + 1}: Instruction data is required`;
        }
        if (inst.data.some(byte => byte < 0 || byte > 255 || isNaN(byte))) {
          return `Transaction ${i + 1}, Instruction ${j + 1}: Invalid byte value (must be 0-255)`;
        }
      }
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
      console.log('Fetching transaction estimate with params:');

      const params: SolanaRawTransactionIntentParams = {
        caip2Id: formData.selectedChain,
        // feePayerAddress: formData.solanaFeePayerAddress,
        transactions: transactions.map(tx => ({
          instructions: tx.instructions
            .filter(inst => inst.programId.trim() && inst.data.length > 0)
            .map(inst => ({
              programId: inst.programId,
              keys: inst.keys,
              data: inst.data // Use the number array directly
            })),
          signers: tx.signers?.filter(signer => signer.trim()) || [],
          feePayerAddress: formData.solanaFeePayerAddress
        }))
      };

      const feePayer = formData.feePayerAddress as `0x${string}`;
      console.log('Params:', params);
      const result = await svmRawTransactionWithEstimate(
        oktoClient,
        params,
        feePayer
      );

      setEstimate(result.details);
      setUserOp(result.userOp);
      setCurrentStep(2);
    } catch (err: any) {
      setError(
        err instanceof BaseError
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
    } catch (err: any) {
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
      feePayerAddress: '',
      solanaFeePayerAddress: ''
    });
    setTransactions([{
      instructions: [{
        programId: '',
        keys: [],
        data: [] // Reset to empty array
      }],
      signers: []
    }]);
  };

  const selectedChainData = chains.find(c => c.caipId === formData.selectedChain);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Example payloads
  const loadSolTransferExample = () => {
    setFormData(prev => ({
      ...prev,
      selectedChain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      solanaFeePayerAddress: 'BDaXfYQ9TE2SYNqVGkrxdigeTQwJZUoD1WtFTy3xAUzc',
      feePayerAddress: '0xb213B747fA4F22e3f8471F60c5559b20619b9FaD'
    }));

    setTransactions([{
      instructions: [{
        programId: '11111111111111111111111111111111',
        keys: [
          {
            pubkey: 'BDaXfYQ9TE2SYNqVGkrxdigeTQwJZUoD1WtFTy3xAUzc',
            isSigner: true,
            isWritable: true
          },
          {
            pubkey: 'F6ZXHJr9zStDTwL2SuNuPvT51s5Dzf3cEuoyJSTYiCWM',
            isSigner: false,
            isWritable: true
          }
        ],
        data: [2, 0, 0, 0, 228, 237, 45, 0, 0, 0, 0, 0]
      }],
      signers: [
        'BDaXfYQ9TE2SYNqVGkrxdigeTQwJZUoD1WtFTy3xAUzc',
        '7JhWaV8iCCGrfB75Bsd3j3CPrsPGk4xhcUR539MhHbWi'
      ]
    }]);
  };

  const loadExample2 = () => {
    setFormData(prev => ({
      ...prev,
      selectedChain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      solanaFeePayerAddress: '2UXHkrX8FhDteCkaZGUSmfwZMryN4gxkuM2V8WZtbuk2'
    }));

    setTransactions([{
      instructions: [{
        programId: '11111111111111111111111111111111',
        keys: [
          {
            pubkey: '7PTHVih2sFNJVvyUoQktLM1P4Upo5o5jJEhvBi9hLHKp',
            isSigner: true,
            isWritable: true
          },
          {
            pubkey: 'F6ZXHJr9zStDTwL2SuNuPvT51s5Dzf3cEuoyJSTYiCWM',
            isSigner: false,
            isWritable: true
          }
        ],
        data: [
          2, 0, 0, 0, 228, 237, 45, 0, 0, 0, 0, 0
        ]
      }],
      signers: [
        '7PTHVih2sFNJVvyUoQktLM1P4Upo5o5jJEhvBi9hLHKp',
        '2UXHkrX8FhDteCkaZGUSmfwZMryN4gxkuM2V8WZtbuk2'
      ],
    }]);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Main Container */}
        <div className="relative bg-gradient-to-br from-white via-purple-50 to-green-50 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Glowing Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-green-500/10 to-blue-500/10 blur-sm"></div>
          <div className="relative bg-white/95 backdrop-blur-xl m-0.5 rounded-2xl">

            {/* Header */}
            <div className="relative p-8 pb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Cpu className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-green-600 to-blue-600 bg-clip-text text-transparent">
                    Raw Solana Transaction
                  </h1>
                  <p className="text-slate-600 text-lg">Execute custom Solana instructions with precision</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center space-x-4 mt-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                      ${currentStep >= step
                        ? 'bg-gradient-to-br from-purple-500 to-green-600 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                        : 'border-slate-300 text-slate-500 bg-slate-100'}
                    `}>
                      {currentStep > step ? <Check size={16} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`
                        w-16 h-0.5 mx-2 transition-all duration-300
                        ${currentStep > step ? 'bg-gradient-to-r from-purple-500 to-green-600' : 'bg-slate-300'}
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
                      <Shield className="mr-2 text-purple-500" size={16} />
                      Solana Network
                    </label>
                    <div className="relative">
                      <select
                        value={formData.selectedChain}
                        onChange={handleNetworkChange}
                        className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 appearance-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select Solana Network</option>
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
                              : 'SOL tokens required for transactions. Please obtain tokens from faucets.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fee Payer Address */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Zap className="mr-2 text-yellow-500" size={16} />
                      Fee Payer Address (Required)
                    </label>
                    <input
                      type="text"
                      value={formData.feePayerAddress}
                      onChange={(e) => updateFormData('feePayerAddress', e.target.value)}
                      placeholder="Enter Ethereum fee payer address (0x...)"
                      className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 shadow-sm font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      This Ethereum address will pay for the SVM gas fees
                    </p>
                  </div>

                  {/* Solana Fee Payer Address */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Zap className="mr-2 text-blue-500" size={16} />
                      Solana Fee Payer Address (Required)
                    </label>
                    <input
                      type="text"
                      value={formData.solanaFeePayerAddress}
                      onChange={(e) => updateFormData('solanaFeePayerAddress', e.target.value)}
                      placeholder="Enter Solana fee payer address (base58)"
                      className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      This Solana address will pay for transaction fees on Solana
                    </p>
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
                    readOnly
                    className="w-full p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-mono text-sm"
                  />
                  {formData.selectedChain && formData.fromAddress && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <Check className="mr-1" size={14} />
                      Auto-filled with your wallet address for this network
                    </p>
                  )}
                </div>

                {/* Example Payloads */}
                {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Example Payloads</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={loadSolTransferExample}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      Load SOL Transfer Example
                    </button>
                    <button
                      onClick={loadExample2}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      Load SOL Transfer Example 2
                    </button>
                  </div>
                </div> */}

                {/* Transaction Instructions */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Solana Transactions</h3>
                    <button
                      onClick={addTransaction}
                      className="bg-gradient-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Transaction
                    </button>
                  </div>

                  {transactions.map((transaction, txIndex) => (
                    <div key={txIndex} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-700">Transaction {txIndex + 1}</h4>
                        {transactions.length > 1 && (
                          <button
                            onClick={() => removeTransaction(txIndex)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-slate-600">Instructions</h5>
                          <button
                            onClick={() => addInstruction(txIndex)}
                            className="text-purple-500 hover:text-purple-700 text-sm flex items-center transition-colors duration-200"
                          >
                            <Plus size={14} className="mr-1" />
                            Add Instruction
                          </button>
                        </div>

                        {transaction.instructions.map((instruction, instIndex) => (
                          <div key={instIndex} className="bg-white border border-slate-200 p-4 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-600">Instruction {instIndex + 1}</span>
                              {transaction.instructions.length > 1 && (
                                <button
                                  onClick={() => removeInstruction(txIndex, instIndex)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Program ID */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-600">
                                Program ID *
                              </label>
                              <input
                                type="text"
                                value={instruction.programId}
                                onChange={(e) => updateInstruction(txIndex, instIndex, 'programId', e.target.value)}
                                placeholder="11111111111111111111111111111112"
                                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-mono text-sm"
                              />
                            </div>

                            {/* Instruction Data */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-600">
                                Instruction Data (Comma-separated bytes) *
                              </label>
                              <input
                                type="text"
                                value={formatDataArray(instruction.data)}
                                onChange={(e) => updateInstructionData(txIndex, instIndex, e.target.value)}
                                placeholder="Enter comma-separated bytes (e.g., 2,0,0,0,228,237,45,0,0,0,0,0)"
                                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-mono text-sm"
                              />
                              <div className="flex items-center text-sm text-slate-500">
                                <span>Base64: </span>
                                <span className="font-mono ml-2 bg-slate-100 px-2 py-1 rounded">
                                  {dataToBase64(instruction.data)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Enter bytes as numbers (0-255) separated by commas
                              </p>
                            </div>

                            {/* Account Keys */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-600">
                                  Account Keys
                                </label>
                                <button
                                  onClick={() => addAccountKey(txIndex, instIndex)}
                                  className="text-purple-500 hover:text-purple-700 text-sm flex items-center transition-colors duration-200"
                                >
                                  <Plus size={14} className="mr-1" />
                                  Add Account
                                </button>
                              </div>
                              {instruction.keys.map((key, keyIndex) => (
                                <div key={keyIndex} className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
                                  <input
                                    type="text"
                                    value={key.pubkey}
                                    onChange={(e) => updateAccountKey(txIndex, instIndex, keyIndex, 'pubkey', e.target.value)}
                                    placeholder="Account public key"
                                    className="flex-1 p-2 bg-white border border-slate-300 rounded text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-mono text-xs"
                                  />
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={key.isSigner}
                                      onChange={(e) => updateAccountKey(txIndex, instIndex, keyIndex, 'isSigner', e.target.checked)}
                                      className="mr-1"
                                    />
                                    Signer
                                  </label>
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={key.isWritable}
                                      onChange={(e) => updateAccountKey(txIndex, instIndex, keyIndex, 'isWritable', e.target.checked)}
                                      className="mr-1"
                                    />
                                    Writable
                                  </label>
                                  <button
                                    onClick={() => removeAccountKey(txIndex, instIndex, keyIndex)}
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

                      {/* Signers */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-slate-600">
                            Additional Signers (Optional)
                          </label>
                          <button
                            onClick={() => addSigner(txIndex)}
                            className="text-green-500 hover:text-green-700 text-sm flex items-center transition-colors duration-200"
                          >
                            <Plus size={14} className="mr-1" />
                            Add Signer
                          </button>
                        </div>
                        {transaction.signers?.map((signer, signerIndex) => (
                          <div key={signerIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={signer}
                              onChange={(e) => updateSigner(txIndex, signerIndex, e.target.value)}
                              placeholder="Signer public key"
                              className="flex-1 p-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono text-sm"
                            />
                            <button
                              onClick={() => removeSigner(txIndex, signerIndex)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleGetEstimate}
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin mr-3" size={20} />
                          Getting Estimate...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-3" size={20} />
                          Get Transaction Estimate
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
                      <span className="text-slate-500">SVM Fee Payer:</span>
                      <span className="text-slate-800 font-mono text-xs break-all">{formData.feePayerAddress}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-slate-500">Solana Fee Payer:</span>
                      <span className="text-slate-800 font-mono text-xs break-all">{formData.solanaFeePayerAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Transactions List */}
                {transactions.map((tx, txIndex) => (
                  <div key={txIndex} className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Transaction {txIndex + 1}</h4>

                    <div className="space-y-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-slate-500">Signers:</span>
                        <div className="flex flex-wrap gap-2">
                          {tx.signers?.map((signer, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                              {signer}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-500">Instructions:</span>
                        {tx.instructions.map((inst, instIndex) => (
                          <div key={instIndex} className="bg-white border border-slate-200 p-3 rounded">
                            <div className="font-semibold text-slate-700">Instruction {instIndex + 1}</div>
                            <div className="mt-2">
                              <div className="text-sm text-slate-600">Program ID:</div>
                              <div className="font-mono text-xs break-all">{inst.programId}</div>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm text-slate-600">Data (Bytes):</div>
                              <div className="font-mono text-xs break-all bg-slate-50 p-2 rounded">
                                {inst.data.join(', ')}
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm text-slate-600">Data (Base64):</div>
                              <div className="font-mono text-xs break-all bg-slate-50 p-2 rounded">
                                {dataToBase64(inst.data)}
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm text-slate-600">Accounts:</div>
                              <div className="space-y-1">
                                {inst.keys.map((key, keyIndex) => (
                                  <div key={keyIndex} className="flex items-center">
                                    <span className="font-mono text-xs break-all flex-1">{key.pubkey}</span>
                                    <span className="text-xs bg-slate-100 px-1 rounded ml-2">
                                      {key.isSigner ? 'Signer' : ''} {key.isWritable ? 'Writable' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

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
                  {jobId && (
                    <TransactionStatusModal
                      isOpen={showStatusModal}
                      onClose={() => setShowStatusModal(false)}
                      jobId={jobId}
                      chainData={selectedChainData}
                      oktoClient={oktoClient}
                      intentType="RAW_TRANSACTION"
                      onNewTransaction={resetTransaction}
                    />
                  )}
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-200"
                  >
                    View Transaction Status
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

export default SolanaRawTransactionEstimate;