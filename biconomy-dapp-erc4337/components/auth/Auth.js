import { useState, useEffect, useRef } from "react"
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types"
import SmartAccount from "@biconomy/smart-account"
import { ethers } from "ethers"

import styles from "./auth.module.css"

export default function Auth(){

    const [smartAccount, setSmartAccount] = useState(null);
    const [interval, enableInterval] = useState(false);
    const [loading, setLoading] = useState(false);
    let socialLoginRef = useRef();

    useEffect( ()=>configureSmartAccountLogin(),[interval])

    function configureSmartAccountLogin(){
        // let configLoginInterval = "";
       let configLoginInterval = setInterval(()=>{
            if(!socialLoginRef?.current?.provider){
            initializeSmartAccount();
            clearInterval(configLoginInterval);}
        },1000)
    }
    
    async function login (){
        if(!socialLoginRef.current){
            const socialLogin = new SocialLogin();
            // const signature1 = await socialLoginSDK.whitelistUrl('') // For Prod need to add web domain url for whitelist
            // await socialLoginSDK.init({
            //   chainId: ethers.utils.hexValue(ChainId.POLYGON_MAINNET),  // For Prod need to add web domain url for whitelist
            //   whitelistUrls: {
            //     '': signature1,
            //   }
            // })
            await socialLogin.init(ethers.utils.hexValue(ChainId.POLYGON_MUMBAI));  // For Localhost
            socialLoginRef.current = socialLogin;
        }
        if(!socialLoginRef.current.provider){
            // socialLoginRef.current.showConnectModal();
            socialLoginRef.current.showWallet();
            configureSmartAccountLogin();
        }
        else{
            initializeSmartAccount();
        }
    }

    async function initializeSmartAccount(){
        if(! socialLoginRef?.current?.provider) return;
        setLoading(true);
        socialLoginRef.current.hideWallet();
        const web3Provider = new ethers.providers.Web3Provider(socialLoginRef.current.provider);
        
        try{
            const smartAccount = new SmartAccount(web3Provider, {
                activeNetworkId: ChainId.POLYGON_MUMBAI,
                supportedNetworksIds: [ChainId.POLYGON_MUMBAI]
                // networkConfig: [
                //   {
                //     chainId: ChainId.POLYGON_MUMBAI,
                //     // Dapp API Key you will get from new Biconomy dashboard that will be live soon
                //     // Meanwhile you can use the test dapp api key mentioned above
                //     dappAPIKey: "boCCwzoGv.78f4b3e3-1d6d-411c-b526-05f2a67540eb"
                //   }
                // ]
            });
            await smartAccount.init();
            console.log("provider",socialLoginRef.current.provider );
            console.log("smartAccount", smartAccount)
            setSmartAccount(smartAccount);
            setLoading(false);
        }
        catch(error){
            alert("Smart Account init Error", error);
        }
    }


    const logout = async () => {
        if (!socialLoginRef.current) {
          console.error('Web3Modal not initialized.')
          return;
        }
        await socialLoginRef.current.logout();
        socialLoginRef.current.hideWallet();
        setSmartAccount(null);
        enableInterval(false);
      }

const gaslesstransferToken = async ()=>{
    let recipientAddress = "0x0a440E6C019473AC554b7dD77bb9e799DA5D84b6";
    let amount = 1;
    let tokenContractAddress = "0x1408651E7254C89FAb6ACE33fE8C6Ee3D6F378Fa";
    const erc20Interface = new ethers.utils.Interface([
        'function transfer(address _to, uint256 _value)'
      ])
      
      // Encode an ERC-20 token transfer to the recipient of the specified amount
      const data = erc20Interface.encodeFunctionData(
        'transfer', [recipientAddress, amount ]
      )
      
      const tx1 = {
        to: tokenContractAddress,
        data
      }
      
      // Transaction subscription
      smartAccount.on('txHashGenerated', (response) => {
        console.log('txHashGenerated event received via emitter', response);
        showSuccessMessage(`Transaction sent: ${response.hash}`);
      });
      smartAccount.on('txMined', (response) => {
        console.log('txMined event received via emitter', response);
        showSuccessMessage(`Transaction mined: ${response.hash}`);
      });
      smartAccount.on('error', (response) => {
        console.log('error event received via emitter', response);
      });
      
      // Sending gasless transaction
      const txResponse = await smartAccount.sendTransaction({ transaction: tx1 });
      console.log('userOp hash', txResponse.hash);
      // If you do not subscribe to listener, one can also get the receipt like shown below 
      const txReciept = await txResponse.wait();
      console.log('Tx hash', txReciept.transactionHash);
      
      // DONE! You just sent a gasless transaction
}
    return (
        <div className={styles.containerStyle}>
        <h1 className={styles.headerStyle}>BICONOMY AUTH</h1>
        {
          !smartAccount && !loading && <button className={styles.buttonStyle} onClick={login}>Login</button>
        }
        {
          loading && <p>Loading account details...</p>
        }
        {
          !!smartAccount && (
            <div className={styles.detailsContainerStyle}>
              <h3>Smart account address:</h3>
              <p>{smartAccount.address}</p>
              <button className={styles.buttonStyle} onClick={gaslesstransferToken}>Transfer Token</button>
              <button className={styles.buttonStyle} onClick={logout}>Logout</button>
            </div>
          )
        }
      </div>
    )
}