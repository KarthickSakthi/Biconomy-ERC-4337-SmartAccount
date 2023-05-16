import { useState, useEffect, useRef } from "react"
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types"
import SmartAccount from "@biconomy/smart-account"
import { ethers } from "ethers"

import styles from "./auth.module.css"

export default Auth = ()=>{

    const [smartAccount, setSmartAccount] = useState(null);
    const [interval, enableInterval] = useState(false);
    const [loading, setLoading] = useState(false);
    let socialLoginRef = useRef();

    useEffect( function configureSmartAccountLogin(){
        let configLoginInterval = "";
        if(interval){
        configLoginInterval = setInterval(()=>{
            if(socialLoginRef.current.provider){
            initializeSmartAccount();
            clearInterval(configLoginInterval);}
        },1000)}
    },[interval])

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
            socialLoginRef = socialLogin.current;
        }
        if(!socialLoginRef.current.provider){
            socialLoginRef.current.showConnectModal();
            socialLoginRef.current.showWallet();
            enableInterval(true);
        }
        else{
            initializeSmartAccount();
        }
    }

    async function initializeSmartAccount(){
        if(! socialLoginRef?.current?.provider) return;
        setLoading(true);
        socialLoginRef.current.hideWallet();
        const web3Provider = new ethers.providers.web3Provider(socialLoginRef.current.provider);
        
        try{
            const smartAccount = new SmartAccount(web3Provider, {
                activeNetworkId: ChainId.POLYGON_MUMBAI,
                supportedNetworksIds: [ChainId.POLYGON_MUMBAI]
            });
            await smartAccount.init();
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
    return (
        <div className={styles.containerStyle}>
      <h1 className={styles.headerStyle}>BICONOMY AUTH</h1>
      {loading ? (<button className={styles.buttonStyle} onClick={login}>Login</button> ): !smartAccount ? (<button className={styles.buttonStyle} onClick={login}>Login</button>) : (
          <div className={styles.detailsContainerStyle}>
            <h3>Smart account address:</h3>
            <p>{smartAccount.address}</p>
            <button className={styles.buttonStyle} onClick={logout}>Logout</button>
          </div>
        )  }
     
    </div>
    )
}