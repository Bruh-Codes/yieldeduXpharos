import React, { lazy, Suspense } from "react";
import { Asset } from "./CollateralAssets";
import { Skeleton } from "@/components/ui/skeleton";
const Card = lazy(() =>
	import("@/components/ui/card").then((module) => ({
		default: module.Card,
	}))
);
interface borrowDetailsProps {
	collateralAmount: string;
	healthFactor: number;
	selectedCollateral?: object | Asset;
	customInputActive: boolean;
	borrowAmount: string;
	duration: number;
	customDuration: string;
	selectedBorrowAsset: object | Asset;
}
const BorrowDetails = ({
	collateralAmount,
	healthFactor,
	selectedCollateral,
	borrowAmount,
	duration,
	customDuration,
	customInputActive,
	selectedBorrowAsset,
}: borrowDetailsProps) => {
	// Calculate payment at maturity
	const calculatePayment = () => {
		if (!borrowAmount) return "0";
		const principal = parseFloat(borrowAmount);
		const apy = calculateAPY() / 100;
		const years = duration / 365;
		return (principal * (1 + apy * years)).toFixed(2);
	};

	const durationOptions = [
		{ label: "7 Days", value: 7, apy: 3.5 },
		{ label: "30 Days", value: 30, apy: 5.2 },
		{ label: "90 Days", value: 90, apy: 8.4 },
		{ label: "Custom", value: 0, apy: 0 },
	];

	const calculateAPY = () => {
		const baseAPY =
			duration === 0
				? 4.5
				: durationOptions.find((option) => option.value === duration)?.apy ||
				  4.5;

		return baseAPY + (healthFactor > 2 ? 0.5 : 0);
	};

	return (
		<div className="col-span-12 lg:col-span-4">
			<Suspense fallback={<Skeleton className="h-80 w-full bg-[#432d9225]" />}>
				<Card className=" dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
					<h3 className="text-lg font-semibold mb-4">Borrow Details</h3>
					<div>
						{[
							{
								label: "Collateral",
								value: `${collateralAmount || "0"} ${
									selectedCollateral && "symbol" in selectedCollateral
										? selectedCollateral.symbol
										: ""
								}`,
							},
							{
								label: "Borrow Amount",
								value: `${borrowAmount || "0"} ${
									selectedBorrowAsset && "symbol" in selectedBorrowAsset
										? selectedBorrowAsset.symbol
										: ""
								}`,
							},
							{
								label: "Duration",
								value: `${
									customInputActive && customDuration
										? customDuration
										: duration
								} Days`,
							},
							{
								label: "Interest Rate (APY)",
								value: `${calculateAPY().toFixed(2)}%`,
							},
							{
								label: "Payment at Maturity",
								value: `${calculatePayment()} ${
									selectedBorrowAsset && "symbol" in selectedBorrowAsset
										? selectedBorrowAsset.symbol
										: ""
								}`,
							},
							{ label: "Health Factor", value: healthFactor.toFixed(2) },
						].map(({ label, value }) => (
							<div key={label}>
								<div className="flex justify-between py-2 border-b border-gray-800">
									<span className="text-sm text-gray-400">{label}</span>
									<span className="text-sm font-medium">{value}</span>
								</div>
							</div>
						))}
					</div>
				</Card>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-56 w-full bg-[#432d9225]" />}>
				<Card className="lg:col-span-4 mt-6 dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
					<h3 className="text-lg font-semibold mb-4">Your Borrowed Assets</h3>
					<div className="text-center py-6">
						<p className="text-gray-400">You have no active loans</p>
					</div>
				</Card>
			</Suspense>

			<Card className="lg:col-span-4 mt-6 dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm mb-6">
				<h3 className="text-lg font-semibold mb-4">Liquidation Risk</h3>
				<p className="text-sm text-gray-400 mb-4">
					Your collateral may be liquidated if your health factor falls below
					1.0. Maintain a higher health factor to reduce risk.
				</p>
				<div className="py-2 px-3 rounded-lg bg-gray-800 text-sm">
					<p className="text-yellow-400 mb-1">Safe Borrowing Tips:</p>
					<ul className="list-disc pl-4 text-gray-400">
						<li>Keep health factor above 1.5 for safety</li>
						<li>Monitor market conditions regularly</li>
						<li>Be prepared to add more collateral if needed</li>
					</ul>
				</div>
			</Card>
		</div>
	);
};

export default BorrowDetails;
