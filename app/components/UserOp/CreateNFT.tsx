"use client";
import React, { useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
// import { nftCollectionCreation, useOkto } from "@okto_web3/react-sdk";

function CreateNFTCollection() {
  const oktoClient = useOkto();

  const [networkName, setNetworkName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [userOp, setUserOp] = useState<any | null>(null);
  const [userOpString, setUserOpString] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("1155");

  const handleSubmit = async () => {
    const nftCollectionParams = {
      networkId: networkName,
      name,
      description,
      metadataUri,
      symbol,
      type,
    };

    console.log("NFT collection params", nftCollectionParams);

    try {
      // const userOpTmp = await nftCollectionCreation(nftCollectionParams, oktoClient);
      // setUserOp(userOpTmp);
      // setUserOpString(JSON.stringify(userOpTmp, null, 2));
    } catch (error: any) {
      console.error("NFT Creation failed:", error);
      setModalMessage("Error: " + error.message);
      setModalVisible(true);
    }
  };

  const handleSubmitUserOp = async () => {
    if (!userOpString) return;
    try {
      const editedUserOp = JSON.parse(userOpString);
      const signedUserOp = await oktoClient.signUserOp(editedUserOp);
      const tx = await oktoClient.executeUserOp(signedUserOp);
      setModalMessage("NFT Creation Submitted: " + JSON.stringify(tx, null, 2));
      setModalVisible(true);
    } catch (error: any) {
      console.error("NFT Creation failed:", error);
      setModalMessage("Error: " + error.message);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => setModalVisible(false);

  return (
    <div className="flex flex-col items-center bg-black p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">Create NFT Collection</h1>
      
      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={networkName}
        onChange={(e) => setNetworkName(e.target.value)}
        placeholder="Enter Network ChainId"
      />
      
      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter Collection Name"
      />
      
      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter Collection Description"
      />
      
      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Enter Collection Symbol"
      />
      
      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={metadataUri}
        onChange={(e) => setMetadataUri(e.target.value)}
        placeholder="Enter Metadata URI"
      />

      <input
        className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Enter NFT Type (e.g. 1155, 721)"
      />

      <button
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleSubmit}
      >
        Create NFT Operation
      </button>

      {userOp && (
        <>
          <div className="w-full mt-4">
            <textarea
              className="w-full p-4 bg-gray-800 rounded text-white font-mono text-sm"
              value={userOpString}
              onChange={(e) => setUserOpString(e.target.value)}
              rows={10}
              style={{ resize: 'vertical' }}
            />
          </div>
          <button
            className="w-full p-2 mt-4 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleSubmitUserOp}
          >
            Sign and Send Transaction
          </button>
        </>
      )}

      {modalVisible && (
        <div className="fixed text-white inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-black rounded-lg w-11/12 max-w-md p-6">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <div className="text-white text-lg font-semibold">NFT Creation Status</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>
            <div className="text-left">
              <pre className="whitespace-pre-wrap">{modalMessage}</pre>
            </div>
            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateNFTCollection; 