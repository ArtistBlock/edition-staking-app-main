import { useEffect, useState } from "react";
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
    const [claimableRewards, setClaimableRewards] = useState<BigNumber | null>(null);
    const { data: stakedTokens } = useContractRead(contract, "getStakeInfo", [address]);

    useEffect(() => {
        if (!contract || !address) return;

        async function loadClaimableRewards() {
            const stakeInfo0 = await contract?.call?.("getStakeInfoForToken", [0, address]);
            const stakeInfo1 = await contract?.call?.("getStakeInfoForToken", [1, address]);
            const stakeInfo2 = await contract?.call?.("getStakeInfoForToken", [2, address]);

            const claimableRewards0 = stakeInfo0[1];
            const claimableRewards1 = stakeInfo1[1];
            const claimableRewards2 = stakeInfo2[1];
            const totalClaimableRewards = claimableRewards0.add(claimableRewards1).add(claimableRewards2);

            setClaimableRewards(totalClaimableRewards);
        }

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
                <h1 className={styles.h1}>Mint An NFT!</h1>
                <p className={styles.explain}>
                    Here is where we use our <b>Edition Drop</b> contract to allow users to mint one of the NFTs that we lazy minted.
                </p>
            </div>
            <hr className={`${styles.smallDivider} ${styles.detailPageHr}`} />

            <div className={styles.buttonRow}>
                <Web3Button
                    contractAddress={editionDropContractAddress}
                    action={(contract) => contract.erc1155.claim(0, 1)}
                    onSuccess={() => {
                        console.log("NFT Claimed!");
                    }}
                    onError={(error) => {
                        alert(error);
                    }}
                >
                    Claim Fire
                </Web3Button>

                <Web3Button
                    contractAddress={editionDropContractAddress}
                    action={(contract) => contract.erc1155.claim(1, 1)}
                    onSuccess={() => {
                        console.log("Water NFT Claimed!");
                    }}
                    onError={(error) => {
                        alert(error);
                    }}
                >
                    Claim Water
                </Web3Button>

                <Web3Button
                    contractAddress={editionDropContractAddress}
                    action={(contract) => contract.erc1155.claim(2, 1)}
                    onSuccess={() => {
                        console.log("Fire NFT Claimed!");
                    }}
                    onError={(error) => {
                        alert(error);
                    }}
                >
                    Claim Wind
                </Web3Button>
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
                            <Web3Button
                                action={(contract) => contract.call("claimRewards", [0])}
                                contractAddress={stakingContractAddress}
                            >
                                Claim Rewards
                            </Web3Button>
                        </div>
                        <div className={styles.tokenGrid}>
                            <div className={styles.tokenItem}>
                                <h3 className={styles.tokenLabel}>Claimable Rewards</h3>
                                <p className={styles.tokenValue}>
                                    <b>{!claimableRewards ? "No rewards" : ethers.utils.formatUnits(claimableRewards, 18)}</b>{" "}
                                    {tokenBalance?.symbol}
                                </p>
                            </div>
                            <div className={styles.tokenItem}>
                                <h3 className={styles.tokenLabel}>Current Balance</h3>
                                <p className={styles.tokenValue}>
                                    <b>{tokenBalance?.displayValue}</b> {tokenBalance?.symbol}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Stake;