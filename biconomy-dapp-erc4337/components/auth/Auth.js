
import './auth.module.css'
import { useState, useEffect, useRef } from 'react'
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types";
import Transak from "@biconomy/transak";
import { ethers } from 'ethers'
import SmartAccount from "@biconomy/smart-account";
import { paymentAddress } from '@/contracts/payment/address';
import { counterAddress } from '@/contracts/counter/address';
import paymentAbi from "../../contracts/payment/payment.abi.json";
import counterAbi from "../../contracts/counter/counter.abi.json"


export default function Auth() {
  const [smartAccount, setSmartAccount] = useState(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    let configureLogin;
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      const signature1 = await socialLoginSDK.whitelistUrl('https://3000-karthicksak-biconomyerc-jqj0i9c9ka9.ws-us98.gitpod.io')
       await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
        network: "testnet",
        whitelistUrls: {
          'https://3000-karthicksak-biconomyerc-jqj0i9c9ka9.ws-us98.gitpod.io': signature1,
        }
      })
      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    setProvider(web3Provider)
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI, ChainId.GOERLI],
        networkConfig: [
          {
            chainId: [ChainId.POLYGON_MUMBAI],
            dappAPIKey: "boCCwzoGv.78f4b3e3-1d6d-411c-b526-05f2a67540eb",
          },
        ],
      })
      await smartAccount.init()
      await smartAccount.deployWalletUsingPaymaster();
      setSmartAccount(smartAccount)
      setLoading(false)
    
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  const gaslesstransferToken = async ()=>{
    // let recipientAddress = "0x0a440E6C019473AC554b7dD77bb9e799DA5D84b6";
    // let amount = 1 ;
    // let tokenContractAddress = "0x1408651E7254C89FAb6ACE33fE8C6Ee3D6F378Fa";
    // const erc20Interface = new ethers.utils.Interface([
    //     'function transfer(address _to, uint256 _value)'
    //   ])
      
    //   // Encode an ERC-20 token transfer to the recipient of the specified amount
    //   const data = erc20Interface.encodeFunctionData(
    //     'transfer', [recipientAddress, amount ]
    //   )
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    const paymentContract = new ethers.Contract(paymentAddress,paymentAbi, web3Provider);
    console.log("provider",smartAccount )
      // const tx = {
      //   to: paymentAddress,
      //   data
      // }
      
      // Transaction subscription
      smartAccount.on('txHashGenerated', (response) => {
        console.log('txHashGenerated event received via emitter', response);
        console.log(`Transaction sent: ${response.hash}`);
      });
      smartAccount.on('txMined', (response) => {
        console.log('txMined event received via emitter', response);
        console.log(`Transaction mined: ${response.hash}`);
      });
      smartAccount.on('error', (response) => {
        console.log('error event received via emitter', response);
      });
       

    const currentTransaction = await paymentContract.populateTransaction.add(1,2);
    console.log("transaction",currentTransaction)
    console.log("smartAccountBeforeTransaction",smartAccount);
    const txObject = {
      to: paymentAddress,
      data: currentTransaction.data,
      }
    /* send the transaction */
    try {
      const gaslessTransaction = await smartAccount.sendTransaction({
        transaction: txObject })
        console.log("gaslessTransaction",gaslessTransaction)
      const receipt = await gaslessTransaction.wait();
      console.log("receipt", receipt )
    } catch (err) {
      console.log('ERROR SENDING TX: ', err)
    }
}

function onRamp(){
  const transak = new Transak('STAGING');
  transak.init();
}

async function crossChainTransfer(){
  console.warn("crossChainTransfer triggered")
  try{const web3Provider = new ethers.providers.Web3Provider(
    sdkRef.current.provider
  )
  const counterContract = new ethers.Contract(counterAddress,counterAbi, web3Provider);
  const counterTransaction = await  counterContract.populateTransaction.increment();
  const txObject = {
    to: counterAddress,
    data: counterTransaction.data,
    }
    console.log("smartAccount",smartAccount)
  const counterTransactionResponse = await smartAccount.sendTransaction({ chainId: ChainId.GOERLI,
    transaction: txObject 
});
  console.log("counterTransaction",counterTransactionResponse );

  const counterTransactionReceipt = await counterTransactionResponse.wait();
  console.log("counterTransactionResponse",counterTransactionResponse)}
  catch (err) {
    console.log('ERROR SENDING TX: ', err)
  }
}

  return (
    <div>
      <h1>Biconomy SDK Auth + Gasless Transactions</h1>
      {
        !smartAccount && !loading && <button onClick={login}>Login</button>
      }
      {
        loading && <p>Loading account details...</p>
      }
      {
        !!smartAccount && (
          <div className="buttonWrapper">
            <h3>Smart account address:</h3>
            <p>{smartAccount.address}</p>
            <button onClick={logout}>Logout</button>
          </div>
        )
      }
      <br/>
     <button onClick={gaslesstransferToken}> Transfer</button>      <br/>
     <br/>
     <button onClick={crossChainTransfer}> Cross chain</button>
     <br/>
     <button onClick={onRamp}> Do on Ramp</button>
    </div>
  )
}





//