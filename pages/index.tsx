import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BigNumber, ethers } from "ethers";
import type { NextPage } from "next";
import {
  ConnectWallet,
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useContractRead,
  useOwnedNFTs,
  useTokenBalance,
  Web3Button,
} from "@thirdweb-dev/react";
import { FaTwitter, FaDiscord } from "react-icons/fa"; 

import NFTCard from "../components/NFTCard";
import {
  editionDropContractAddress,
  stakingContractAddress,
  tokenContractAddress,
} from "../consts/contractAddresses";

import styles from "../styles/Home.module.css";

const Stake: NextPage = () => {
  const router = useRouter();
  const address = useAddress();
  const { contract: nftDropContract } = useContract(editionDropContractAddress, "edition-drop");
  const { contract: tokenContract } = useContract(tokenContractAddress, "token");
  const { contract, isLoading } = useContract(stakingContractAddress);
  const { data: ownedNfts } = useOwnedNFTs(nftDropContract, address);
  const { data: tokenBalance } = useTokenBalance(tokenContract, address);
  const [claimableRewards, setClaimableRewards] = useState<Array<BigNumber | null>>([]);
  const { data: stakedTokens } = useContractRead(contract, "getStakeInfo", [address]);

  useEffect(() => {
    if (!contract || !address) return;

    const loadClaimableRewards = async () => {
      const claimableRewards = await Promise.all(
        [0, 1, 2].map(async (tokenId) => {
          const stakeInfo = await contract?.call?.("getStakeInfoForToken", [tokenId, address]);
          return stakeInfo[1] || ethers.constants.Zero;
        })
      );

      setClaimableRewards(claimableRewards);
    };

    loadClaimableRewards();
  }, [address, contract]);

  const stakeNft = async (id: string) => {
    if (!address) return;

    const isApproved = await nftDropContract?.isApproved?.(address, stakingContractAddress);
    if (!isApproved) {
      await nftDropContract?.setApprovalForAll?.(stakingContractAddress, true);
    }
    await contract?.call?.("stake", [id, 1]);
  };

  const withdrawNft = (id: string) => {
    throw new Error("Function not implemented.");
  };

  if (isLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <h1 className={styles.h1}>Minting the elements of the NFT!</h1>
        <p className={styles.explain}>
          Get rewarded with <b>Electron</b> tokens for stacking NFT!
        </p>
      </div>
      <hr className={`${styles.smallDivider} ${styles.detailPageHr}`} />

      <div className={styles.buttonContainer}>
        {[0, 1, 2].map((tokenId, index) => (
          <React.Fragment key={tokenId}>
            <Web3Button
              contractAddress={editionDropContractAddress}
              action={(contract) => contract.erc1155.claim(tokenId, 1)}
              onSuccess={() => {
                console.log(`NFT Claimed! Token ID: ${tokenId}`);
              }}
              onError={(error) => {
                alert(error);
              }}
              className={styles.claimButton}
            >
              {tokenId === 0 ? "Claim Fire" : tokenId === 1 ? "Claim Water" : "Claim Wind"}
            </Web3Button>
            {index !== 2 && <div className={styles.buttonSpacer} />}
          </React.Fragment>
        ))}
      </div>

      {!address ? (
        <ConnectWallet />
      ) : (
        <>
          <div className={styles.nftSection}>
            <h2>Your NFTs</h2>
            <div className={styles.nftBoxGrid}>
              {stakedTokens?.[0]?.map((stakedToken: BigNumber) => (
                <NFTCard
                  tokenId={stakedToken.toNumber()}
                  key={stakedToken.toString()}
                />
              ))}
              {ownedNfts?.map((nft) => (
                <div className={styles.nftBox} key={nft.metadata.id.toString()}>
                  <ThirdwebNftMedia
                    metadata={nft.metadata}
                    className={styles.nftMedia}
                  />
                  <h3>{nft.metadata.name}</h3>
                  {!stakedTokens || !stakedTokens[0]?.includes(nft.metadata.id) ? (
                    <Web3Button
                      contractAddress={stakingContractAddress}
                      action={() => stakeNft(nft.metadata.id)}
                    >
                      Stake
                    </Web3Button>
                  ) : (
                    <Web3Button
                      contractAddress={stakingContractAddress}
                      action={() => withdrawNft(nft.metadata.id)}
                    >
                      Withdraw
                    </Web3Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />
          <div className={styles.tokenSection}>
            <div className={styles.tokenHeader}>
              <h2>Your Tokens</h2>
              {[0, 1, 2].map((tokenId, index) => (
                <React.Fragment key={tokenId}>
                  <Web3Button
                    action={(contract) => contract.call("claimRewards", [tokenId])}
                    contractAddress={stakingContractAddress}
                    className={styles.rewardButton}
                  >
                    {tokenId === 0 ? "Reward Fire" : tokenId === 1 ? "Reward Water" : "Reward Wind"}
                  </Web3Button>
                  {index !== 2 && <div className={styles.buttonSpacer} />}
                </React.Fragment>
              ))}
            </div>
            <div className={styles.tokenGrid}>
              {[0, 1, 2].map((tokenId) => (
                <div className={styles.tokenItem} key={tokenId}>
                  <h3 className={styles.tokenLabel}>
                    {tokenId === 0 ? "Fire" : tokenId === 1 ? "Water" : "Wind"}
                  </h3>
                  {claimableRewards[tokenId] ? (
                    <p className={styles.tokenValue}>
                      <b>{ethers.utils.formatUnits(claimableRewards[tokenId]!, 18)}</b> {tokenBalance?.symbol}
                    </p>
                  ) : (
                    <p className={styles.tokenValue}>No rewards</p>
                  )}
                </div>
              ))}
              <div className={styles.tokenItem}>
                <h3 className={styles.tokenLabel}>Balance</h3>
                <p className={styles.tokenValue}>
                  <b>{tokenBalance?.displayValue}</b> {tokenBalance?.symbol}
                </p>
              </div>
            </div>
          </div>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />
          <div className={styles.socialLinks}>
            <a
              href="https://twitter.com/CooltestCoin"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <FaTwitter className={styles.socialIcon} />
            </a>
            <a
              href="https://discord.gg/UJHzNRc4ba"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <FaDiscord className={styles.socialIcon} />
            </a>
          </div>
        </>
      )}
      <div className={styles.footer}>
        <p>Donat 0xCC6261C7F9C29A1F69e4021c83AA20a02a225a84</p>
      </div>
    </div>
  );
};

export default Stake;
