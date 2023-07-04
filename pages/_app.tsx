import type { AppProps } from "next/app";
import { Opbnb } from "@thirdweb-dev/chains";
import { ThirdwebSDK } from "@thirdweb-dev/sdk/evm";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChain = "Opbnb";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider activeChain={Opbnb}>
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
