"use client";
import { Card } from "@/components/ui/card";
import { lazy, Suspense, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Skeleton } from "@/components/ui/skeleton";
const AssetSelector = lazy(() => import("./AssetSelector"));
const AmountInput = lazy(() => import("./AmountInput"));

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
	const [isCollateralWithBalanceLoading, setIsCollateralWithBalanceLoading] =
		useState(false);

	useEffect(() => {
		if (address && collateralAssetsWithBalance.length === 0) {
			const fetchBalances = async () => {
				setIsCollateralWithBalanceLoading(true);
				try {
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
				} catch (error) {
					console.log("Failed to fetch token balances", error);
				} finally {
					setIsCollateralWithBalanceLoading(false);
				}
			};

			fetchBalances();
		}
	}, [
		address,
		collateralAssetsWithBalance.length,
		getTokenBalances,
		tokenDetails,
	]);

	return (
		<Card className=" space-y-7 dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
			<h2 className="text-xl font-semibold mb-6">Provide Collateral</h2>

			<AssetSelector
				isCollateralWithBalanceLoading={isCollateralWithBalanceLoading}
				label="Collateral Asset"
				assets={collateralAssetsWithBalance}
				onSelect={(asset) => setSelectedCollateral(JSON.parse(asset))}
			/>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
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
						"symbol" in selectedCollateral
							? selectedCollateral.symbol
							: undefined
					}
				/>
			</Suspense>
		</Card>
	);
};

export default CollateralAssets;
