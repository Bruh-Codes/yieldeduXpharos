"use client";

import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useGetAllowedTokens } from "@/hooks";
import { useAppKitAccount } from "@reown/appkit/react";
import { getYieldPoolConfig } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import { readContract } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import CollateralAssets, { Asset } from "../components/CollateralAssets";
import BorrowAssets from "../components/BorrowAssets";
import BorrowDetails from "../components/BorrowDetails";

const Page = () => {
	const { address } = useAppKitAccount();

	const { data: allowedTokensData } = useReadContract({
		...getYieldPoolConfig("getAllowedTokens", []),
	});

	// const collateralAssetsWithBalance = useGetBallance(address as unknown as `0x${string}`,allowedTokensData)
	const { tokenDetails } = useGetAllowedTokens(
		allowedTokensData as `0x${string}`[]
	);

	const getTokenBalances = (
		walletAddress: string,
		tokenAddress: `0x${string}`
	) => {
		const tokensBalance = readContract(config, {
			address: tokenAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [walletAddress as `0x${string}`],
		});

		return tokensBalance;
	};

	const [customCollateralAmount, setCustomCollateralAmount] = useState("");
	const [borrowAmount, setBorrowAmount] = useState("");
	const [healthFactor, setHealthFactor] = useState(1);
	const [customDuration, setCustomDuration] = useState("");
	const [customInputActive, setCustomInputActive] = useState(false);
	const [duration, setDuration] = useState(30); // Default to 30 days
	const [selectedCollateral, setSelectedCollateral] = useState<Asset | object>(
		{}
	);

	const borrowAssets =
		tokenDetails.filter(
			(assets) =>
				"symbol" in selectedCollateral &&
				assets.symbol !== selectedCollateral.symbol &&
				assets.address !== selectedCollateral.address &&
				assets.name !== selectedCollateral.name
		) || [];

	const [selectedBorrowAsset, setSelectedBorrowAsset] = useState<
		Asset | object
	>({});

	const minimumCollateral = 0.8;

	useEffect(() => {
		if (!customCollateralAmount || !borrowAmount) return;

		const collateral = parseFloat(customCollateralAmount);
		const borrow = parseFloat(borrowAmount);
		const liquidationThreshold = minimumCollateral; // 0.8

		if (collateral > 0 && borrow > 0) {
			const factor = (collateral * liquidationThreshold) / borrow;
			setHealthFactor(factor);
		}
	}, [customCollateralAmount, borrowAmount, minimumCollateral]);

	useEffect(() => {
		setSelectedBorrowAsset({});
	}, [selectedCollateral]);

	return (
		<div className="max-w-7xl py-8 mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Borrow</h1>
				<div className="flex items-center gap-2 text-sm bg-blue-900/30 text-app-blue p-2 rounded-lg">
					<Info size={16} />
					<span>Borrow assets using your crypto as collateral</span>
				</div>
			</div>

			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-8">
					<CollateralAssets
						minimumCollateral={minimumCollateral}
						address={address}
						customCollateralAmount={customCollateralAmount}
						getTokenBalances={getTokenBalances}
						selectedCollateral={selectedCollateral}
						setCustomCollateralAmount={setCustomCollateralAmount}
						setSelectedCollateral={setSelectedCollateral}
						tokenDetails={tokenDetails}
					/>

					<BorrowAssets
						minimumCollateral={minimumCollateral}
						borrowAmount={borrowAmount}
						setBorrowAmount={setBorrowAmount}
						borrowAssets={borrowAssets}
						setSelectedBorrowAsset={setSelectedBorrowAsset}
						customCollateralAmount={customCollateralAmount}
						healthFactor={healthFactor}
						selectedBorrowAsset={selectedBorrowAsset}
						setCustomDuration={setCustomDuration}
						duration={duration}
						setDuration={setDuration}
						customDuration={customDuration}
						customInputActive={customInputActive}
						setCustomInputActive={setCustomInputActive}
					/>
				</div>

				{/* Right column - Info Panels */}
				<BorrowDetails
					collateralAmount={customCollateralAmount}
					healthFactor={healthFactor}
					borrowAmount={borrowAmount}
					customInputActive={customInputActive}
					selectedCollateral={selectedCollateral}
					customDuration={customDuration}
					duration={duration}
					selectedBorrowAsset={selectedBorrowAsset}
				/>
			</div>
		</div>
	);
};

export default Page;
