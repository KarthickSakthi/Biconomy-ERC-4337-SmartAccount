import dynamic from "next/dynamic";
import { Suspense } from "react";
// Biconomy Component Will cause issue due to Server side Rendering, So making a Dynamic Component from Client Side 
 const Index = ()=>{
  const BiconomyDynamicSocialLogin = dynamic(()=> import("../components/auth/Auth").then((res)=> res.default),{ssr:false} );

  return(
    <Suspense fallback={<div>...Loding</div>} >
      <BiconomyDynamicSocialLogin/>
    </Suspense>
  )
}

export default Index;