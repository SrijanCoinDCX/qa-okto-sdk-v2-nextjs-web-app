import { useOkto, getSupportedRampTokens, SupportedRampTokensResponse, WhitelistedToken, OnrampOptions } from "@okto_web3/react-sdk";
import { useState } from "react";
import SupportedTokenList from "./SupportedTokenList";

const AddFunds = () => {
    const oktoClient = useOkto();
    const [tokens, setTokens] = useState<WhitelistedToken[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const [onrampOptions, setOnRampOptions] = useState<OnrampOptions>({
        countryCode: "IN",
        theme: "light",
        appVersion: "1.0.0",
        screenSource: "AddFundsScreen"
    });

    async function fetchTokens(countryCode?: string) {
        setLoading(true);
        try {
            const codeToUse = countryCode || onrampOptions.countryCode || "IN";
            const { onrampTokens }: SupportedRampTokensResponse = await getSupportedRampTokens(oktoClient, codeToUse, "onramp");
            setTokens(onrampTokens);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    function openPopup() {
        fetchTokens();
        setShowPopup(true);
    }

    function handleSelectToken(tokenId: string) {
        oktoClient.openOnrampWebView(tokenId, onrampOptions);
        setShowPopup(false);
    }

    return (
        <>
            <button
                onClick={openPopup}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:scale-105 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
                + Add Funds
            </button>
            <SupportedTokenList
                tokens={tokens}
                showPopup={showPopup}
                setShowPopup={setShowPopup}
                loading={loading}
                handleSelectToken={handleSelectToken}
                onrampOptions={onrampOptions}
                setOnRampOptions={setOnRampOptions} 
                refetchTokens={fetchTokens} 
            />
        </>
    );
};

export default AddFunds;