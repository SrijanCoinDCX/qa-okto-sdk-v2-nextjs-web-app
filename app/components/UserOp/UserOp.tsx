import Link from 'next/link';

const UserOp = () => {
    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md flex flex-row space-x-2">
                <Link
                    href="/pages/transfer"
                    className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
                >
                    Transfer Token
                </Link>
                <div className="w-px bg-gray-300 mx-4"></div>
                <Link
                    href="/pages/createnft"
                    className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
                >
                    NFT Collection Creation
                </Link>
                <div className="w-px bg-gray-300 mx-4"></div>
                <Link
                    href="/pages/transfernft"
                    className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
                >
                    NFT Transfer
                </Link>
                <div className="w-px bg-gray-300 mx-4"></div>
                <Link
                    href="/pages/nftmint"
                    className="flex-1 px-6 py-3 text-black rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-center"
                >
                    NFT Mint
                </Link>
            </div>

            <div className="flex flex-row space-x-2 w-full max-w-lg mt-8">
                <Link
                    href="/pages/evmrawtxn"
                    className="flex-1 h-24 w-58 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center flex items-center justify-center"
                >
                    EVM Raw transaction
                </Link>
                <Link
                    href="/pages/aptosrawtxn"
                    className="flex-1 h-24 w-58 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center flex items-center justify-center"
                >
                    APTOS Raw transaction
                </Link>
                <Link
                    href="/pages/svmrawtxn"
                    className="flex-1 h-24 w-58 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center flex items-center justify-center"
                >
                    SVM Raw transaction
                </Link>
            </div>
        </div>
    );
};

export default UserOp;