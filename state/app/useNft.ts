import { useCallback, useEffect, useState } from "react";
import useContract from "../../hooks/useContract";

import NFT_ABI from "../../constants/abis/JustNFT.json";
import useWallet from "../wallet/hooks/useWallet";
import { BigNumber, Contract } from "ethers";
import useToast from "../../hooks/useToasts";

const useNft = (nftAddress:string|undefined) => {
  const nftContract = useContract(nftAddress, NFT_ABI);
  const { account, web3Provider } = useWallet();
  const [minting, setMinting] = useState(false);
  const [balance, setBalance] = useState<BigNumber | undefined>(undefined);
  const { txSuccess, error, txWaiting, dismiss } = useToast();

  const getBalance = useCallback(async () => {
    if (nftContract && account) {
      const balance = await nftContract.balanceOf(account);
      setBalance(balance);
    } else {
      return;
    }
  }, [nftContract, account]);

  const mint = useCallback(async () => {
    if (account && web3Provider) {
      const signer = web3Provider.getSigner();
if(!nftAddress)  
return;
    const nftContract = new Contract(nftAddress, NFT_ABI, signer);
      setMinting(true);
      const tx = await nftContract.mint(account);
      txWaiting("Minting...");
      await tx.wait();
      dismiss();
      txSuccess("Minted your NFT", tx.hash);
      console.log("Mined -- ", tx.hash);
      getBalance();
      setMinting(false);
    } else {
      return;
    }
  }, [account, nftAddress,web3Provider]);

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  return { balance, mint, minting };
};

export default useNft;
