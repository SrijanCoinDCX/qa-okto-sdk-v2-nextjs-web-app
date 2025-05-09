export type TokenEntity = {
  id: string;
  entityType: string;
  details: {
    address: string;
    chainId: string;
    decimals: string;
    precision: string;
    name: string;
    symbol: string;
    logo: string;
    price: string;
    networkName: string;
    is_active: boolean;
    is_tradable: boolean;
    group_id?: string;
    is_primary?: boolean;
    tags?: string[];
    total_supply?: string;
    type?: string;
    age?: number;
    priority?: number;
    fdv?: number;
    priceChange24h?: number;
    priceVolData?: Record<string, unknown>;
    token_rank?: number;
    category?: string[];
    [key: string]:
      | string
      | number
      | boolean
      | string[]
      | Record<string, unknown>
      | undefined;
  };
};

export type SwapDetails = {
  estimation: {
    amount: string;
    crossChainFee: string;
    crossChainFeeCollector: string;
    gasFeesInInputToken: string;
    integratorFeesInInputToken: string;
    outputAmount: string;
    platformBaseFeesInInputToken: string;
    recommendedSlippage: string;
    routeId: string;
    routeValidUntil: string;
    sameChainFee: string;
    sameChainFeeCollector: string;
    slippageUsed: string;
    totalFeesInInputToken: string;
  };
  swapFees?: {
    totalFeesInInputToken: string;
    platformBaseFeesInInputToken: string;
    gasFeesInInputToken: string;
    integratorFeesInInputToken: string;
  };
  fees: {
    approxTransactionFeesInUSDT: string;
    transactionFees: Record<string, string>;
  };
};

export type TokenListingFilter = {
  type: "discovery" | "network_filter" | "search";
  networks?: string[];
  searchText?: string;
};

export type SwapEstimateResponse = {
  callData: {
    clientSWA: string;
    feePayerAddress: string;
    gsn: {
      isPossible: boolean;
      isRequired: boolean;
      requiredNetworks: [];
      tokens: [];
    };
    intentType: string;
    jobId: string;
    payload: {
      crossChainFee: string;
      crossChainFeeCollector: string;
      fromChainCaip2Id: string;
      fromChainTokenAddress: string;
      fromChainTokenAmount: string;
      routeId: string;
      sameChainFee: string;
      sameChainFeeCollector: string;
      slippage: string;
      toChainCaip2Id: string;
      toChainTokenAddress: string;
      minToTokenAmount: string;
    };
    policies: {
      gsnEnabled: boolean;
      sponsorshipEnabled: boolean;
    };
    userSWA: string;
  };
  details: SwapDetails;
  userOp: UserOp;
};

export type Hex = `0x${string}`;

export type UserOp = {
  callData?: Hex;
  callGasLimit?: Hex;
  factory?: Hex | undefined;
  factoryData?: Hex | undefined;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  nonce?: Hex;
  paymaster?: Hex | undefined;
  paymasterData?: Hex | undefined;
  paymasterPostOpGasLimit?: Hex | undefined;
  paymasterVerificationGasLimit?: Hex | undefined;
  preVerificationGas?: Hex;
  sender?: Hex;
  signature?: Hex;
  verificationGasLimit?: Hex;
};
