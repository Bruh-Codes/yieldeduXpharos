"use client";
import { Card } from "@/components/ui/card";
import { Asset } from "./CollateralAssets";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
// import { useWriteContract } from "wagmi";

const AssetSelector = lazy(() => import("./AssetSelector"));
const AmountInput = lazy(() => import("./AmountInput"));
const DurationSelector = lazy(() => import("@/components/DurationSelector"));
const HealthFactor = lazy(() => import("./HealthFactor"));
const Button = lazy(() =>
	import("@/components/ui/button").then((module) => ({
		default: module.Button,
	}))
);

interface borrowProps {
	borrowAssets: {
		address: `0x${string}`;
		name: string;
		symbol: string;
	}[];
	setSelectedBorrowAsset: (value: React.SetStateAction<object | Asset>) => void;
	borrowAmount: string;
	setBorrowAmount: React.Dispatch<React.SetStateAction<string>>;
	setCustomDuration: React.Dispatch<React.SetStateAction<string>>;
	setCustomInputActive: React.Dispatch<React.SetStateAction<boolean>>;
	setDuration: React.Dispatch<React.SetStateAction<number>>;
	selectedBorrowAsset: object | Asset;
	customCollateralAmount: string;
	healthFactor: number;
	customInputActive: boolean;
	duration: number;
	minimumCollateral: number;
}

const BorrowAssets = ({
	borrowAssets,
	setSelectedBorrowAsset,
	borrowAmount,
	setBorrowAmount,
	selectedBorrowAsset,
	setDuration,
	duration,
	setCustomInputActive,
	customInputActive,
	customCollateralAmount,
	minimumCollateral,
	healthFactor,
}: borrowProps) => {
	const [isLoading] = useState(false);

	const buttonGridRef = useRef<HTMLDivElement>(null);
	const customInputRef = useRef<HTMLInputElement | null>(null);
	const [lockDurationCustom, setLockDurationCustom] = useState(0);
	const [showCustomInput, setShowCustomInput] = useState(false);

	const HEALTH_FACTOR_DANGER = 1.0;

	useEffect(() => {
		const customInput = customInputRef.current;

		const handleFocus = () => (
			setCustomInputActive(true), setDuration(lockDurationCustom)
		);
		const handleBlur = (e: FocusEvent) => {
			const clickedElement = e.relatedTarget as Node;
			const isClickInsideGrid = buttonGridRef.current?.contains(clickedElement);
			if (!isClickInsideGrid) return;

			if (duration) {
				setCustomInputActive(false);
			}
		};

		customInput?.addEventListener("focus", handleFocus);
		customInput?.addEventListener("blur", handleBlur);

		return () => {
			customInput?.removeEventListener("focus", handleFocus);
			customInput?.removeEventListener("blur", handleBlur);
		};
	}, [duration, lockDurationCustom, setCustomInputActive, setDuration]);

	// const {writeContract} = useWriteContract({});

	const handleBorrow = async () => {
		if (
			!Number(customCollateralAmount) ||
			Number(customCollateralAmount) < minimumCollateral
		) {
			toast({
				title: "Collateral Error",
				description: "Collateral amount is insufficient.",
				variant: "destructive",
			});
		}

		if (!Number(borrowAmount)) {
			toast({
				title: "Borrow amount Error",
				variant: "destructive",
				description: "Please enter a valid borrow amount.",
			});
		}

		if (!Number(duration)) {
			toast({
				title: "Invalid duration",
				variant: "destructive",
				description: "Please select a valid duration.",
			});
		}

		if (healthFactor < HEALTH_FACTOR_DANGER) {
			toast({
				title: "Health factor Error",
				variant: "destructive",
				description: "Health factor is too low to proceed.",
			});
		}

		//smart contract call to borrow assets
	};

	return (
		<Card className="dark:bg-gradient-to-r space-y-7 from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
			<h2 className="text-xl font-semibold mb-6">Borrow Assets</h2>
			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<AssetSelector
					label="Borrow Asset"
					assets={borrowAssets}
					onSelect={(asset) => setSelectedBorrowAsset(JSON.parse(asset))}
					disabled={borrowAssets.length === 0}
				/>
			</Suspense>
			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<div className="mt-4">
					<AmountInput
						minimumCollateral={minimumCollateral}
						label="Borrow Amount"
						value={borrowAmount}
						onChange={setBorrowAmount}
						hideAvailable={true}
						symbol={
							selectedBorrowAsset && "symbol" in selectedBorrowAsset
								? selectedBorrowAsset.symbol
								: undefined
						}
					/>
				</div>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<DurationSelector
					buttonGridRef={buttonGridRef}
					customInputActive={customInputActive}
					customInputRef={customInputRef}
					lockDuration={duration}
					lockDurationCustom={lockDurationCustom}
					setCustomInputActive={setCustomInputActive}
					setLockDuration={setDuration}
					setLockDurationCustom={setLockDurationCustom}
					setShowCustomInput={setShowCustomInput}
					showCustomInput={showCustomInput}
				/>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<HealthFactor
					HEALTH_FACTOR_DANGER={HEALTH_FACTOR_DANGER}
					value={healthFactor}
					healthFactor={healthFactor}
				/>
			</Suspense>
			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<Button
					className="w-full !py-7 text-md bg-gradient-to-r from-sky-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
					onClick={handleBorrow}
					disabled={
						true
						// !Number(customCollateralAmount) ||
						// Number(customCollateralAmount) < minimumCollateral ||
						// !Number(borrowAmount) ||
						// !Number(duration) ||
						// healthFactor < HEALTH_FACTOR_DANGER ||
						// healthFactor < HEALTH_FACTOR_DANGER
					}
				>
					{healthFactor < HEALTH_FACTOR_DANGER ? (
						"Health Factor Too Low"
					) : isLoading ? (
						<>
							<div className="size-6 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-green-950" />
							Please wait...{" "}
						</>
					) : (
						"Borrow Now"
					)}
				</Button>

				{healthFactor < HEALTH_FACTOR_DANGER && (
					<p className="text-sm  mt-4 text-center text-gray-400">
						Minimum health factor of 1.03 required for borrowing
					</p>
				)}
			</Suspense>
		</Card>
	);
};

export default BorrowAssets;
