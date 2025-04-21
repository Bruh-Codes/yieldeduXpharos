"use client";
import { Card } from "@/components/ui/card";
import AssetSelector from "./AssetSelector";
import AmountInput from "./AmountInput";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

export type Asset = {
	balance?: string;
	address: `0x${string}`;
	name: string;
	symbol: string;
};

interface collateralAssetProps {
	tokenDetails: Asset[];
	getTokenBalances: (
		walletAddress: string,
		tokenAddress: `0x${string}`
	) => Promise<bigint>;
	address: string | undefined;
	setCustomCollateralAmount: React.Dispatch<React.SetStateAction<string>>;
	setSelectedCollateral: React.Dispatch<React.SetStateAction<Asset>>;
	customCollateralAmount: string;
	selectedCollateral: Asset | object;
	minimumCollateral: number;
}
const CollateralAssets = ({
	tokenDetails,
	getTokenBalances,
	address,
	setCustomCollateralAmount,
	setSelectedCollateral,
	customCollateralAmount,
	selectedCollateral,
	minimumCollateral,
}: collateralAssetProps) => {
	const [collateralAssetsWithBalance, setCollateralAssetsWithBalance] =
		useState<Asset[]>([]);

	useEffect(() => {
		if (address) {
			const fetchBalances = async () => {
				const balances = await Promise.all(
					tokenDetails.map(async (token) => ({
						...token,
						icon: token.symbol,
						balance: formatUnits(
							await getTokenBalances(
								address as unknown as `0x${string}`,
								token.address
							),
							18
						),
					}))
				);
				setCollateralAssetsWithBalance(balances);
			};

			fetchBalances();
		}
	}, [address, getTokenBalances, tokenDetails]);

	return (
		<Card className=" space-y-7 dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
			<h2 className="text-xl font-semibold mb-6">Provide Collateral</h2>

			<AssetSelector
				label="Collateral Asset"
				assets={collateralAssetsWithBalance}
				onSelect={(asset) => setSelectedCollateral(JSON.parse(asset))}
			/>

			<AmountInput
				minimumCollateral={minimumCollateral}
				label="Collateral Amount"
				value={customCollateralAmount}
				selectedCollateral={selectedCollateral}
				onChange={setCustomCollateralAmount}
				max={
					"balance" in selectedCollateral
						? selectedCollateral.balance
						: undefined
				}
				symbol={
					"symbol" in selectedCollateral ? selectedCollateral.symbol : undefined
				}
			/>
		</Card>
	);
};

export default CollateralAssets;
