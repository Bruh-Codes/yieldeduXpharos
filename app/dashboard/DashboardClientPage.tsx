"use client";
import { useReadContract } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { getYieldPoolConfig, YieldTokenAddress } from "@/lib/utils";
import { formatEther } from "viem";
import { useState } from "react";
import usePositions from "@/hooks/usePositions";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Percent, Vault, Coins } from "lucide-react";
// import DepositForm from "@/components/DepositForm";

// import FaucetButton from "@/components/ui/FaucetButton";
import WithdrawModal from "@/components/WithdrawModal";
import StakingCard from "@/components/StakingCard";
import PositionOverview from "@/components/PositionOverview";
// import Performance from "@/components/Performance";
import ActivePositions from "@/components/ActivePositions";
import AddToAllowedTokens from "@/components/AddToAllowedTokens";
// import Performance from "@/components/Performance";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGetAllowedTokens, useGetBallance } from "@/hooks";

const DashboardClientPage = () => {
	const { address } = useAppKitAccount();
	const { userPositions } = usePositions();

	const [modalType, setModalType] = useState<"withdraw" | "unstake" | null>(
		null
	);
	const [showWithdrawModal, setShowWithDrawModal] = useState(false);
	const [selectedTokenAddress, setSelectedTokenAddress] =
		useState(YieldTokenAddress);

	// const [showModal, setShowModal] = useState(false);

	const results = useGetBallance(
		address as unknown as `0x${string}`,
		selectedTokenAddress
	);

	const BASE_APY = 10;

	const { data: tvl } = useReadContract({
		...getYieldPoolConfig("getTotalValueLocked", []),
	});

	const formattedTVL = tvl ? formatEther(BigInt(tvl.toString())) : "0.00";

	const { data: totalStakers } = useReadContract({
		...getYieldPoolConfig("getTotalStakers", []),
	});

	const { data: allowedTokensData } = useReadContract({
		...getYieldPoolConfig("getAllowedTokens", []),
	});

	const { tokenDetails } = useGetAllowedTokens(
		allowedTokensData as `0x${string}`[]
	);

	return (
		<>
			{address === process.env.NEXT_PUBLIC_OWNER_ADDRESS && (
				<AddToAllowedTokens />
			)}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<Card className="relative dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
					<div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-10"></div>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="p-3 bg-sky-500/20 rounded-xl">
								<ShieldCheck className="size-8 text-sky-400" />{" "}
							</div>
							<div>
								<p className="text-md text-slate-400">TVL</p>
								<p className="text-4xl mt-2 font-bold text-sky-400">
									{parseFloat(formattedTVL).toFixed(2)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
					<div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-10"></div>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="p-3 bg-sky-500/20 rounded-xl">
								<Percent className="size-8 text-sky-400" />
							</div>
							<div>
								<p className="text-md text-slate-400">Base APY</p>
								<p className="text-4xl mt-2 font-bold text-sky-400">
									{BASE_APY}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
					<div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-10"></div>

					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="p-3 bg-sky-500/20 rounded-xl">
								<Vault className="size-8 text-sky-400" />
							</div>

							<div>
								<p className="text-md text-slate-400">Total Stakers</p>
								<p className="text-4xl mt-2 text-end font-bold text-sky-400">
									{totalStakers ? Number(totalStakers).toString() : "0"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
					<div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-10"></div>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="p-3 bg-sky-500/20 rounded-xl">
								<Coins className="size-8 text-sky-400" />
							</div>
							<div>
								<p className="text-md flex items-center gap-5 text-slate-400">
									Balance
									<Select
										value={selectedTokenAddress}
										onValueChange={(value: `0x${string}`) =>
											setSelectedTokenAddress(value)
										}
										disabled={tokenDetails.length === 0}
									>
										<SelectTrigger className="w-[130px] focus:!ring-sky-500 focus:!border-transparent focus:ring-offset-2 ring-offset-sky-700 border-none p-2 bg-sky-500  border-sky-200 relative flex items-center justify-between cursor-pointer text-white text-md">
											<SelectValue placeholder="Select Token" />
										</SelectTrigger>
										<SelectContent className="bg-white dark:bg-sky-500 border border-sky-100 dark:border-sky-700 rounded-lg shadow-md">
											<SelectGroup>
												{tokenDetails.map((token) => {
													return (
														<SelectItem
															className="hover:bg-sky-600"
															key={token.symbol}
															value={token.address}
														>
															{token.symbol}
														</SelectItem>
													);
												})}
											</SelectGroup>
										</SelectContent>
									</Select>
								</p>
								<p className="text-4xl mt-2 text-end font-bold text-sky-400">
									{results?.data?.formatted
										? parseFloat(results.data.formatted).toFixed(2)
										: "0.00"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 lg:space-y-0  xl:gap-6 h-auto">
				<StakingCard />
				<PositionOverview
					setModalType={setModalType}
					positions={userPositions}
					setShowWithDrawModal={setShowWithDrawModal}
				/>
			</div>
			<ActivePositions
				setModalType={setModalType}
				setShowWithDrawModal={setShowWithDrawModal}
				positions={userPositions}
			/>
			{/* <Performance /> */}

			<WithdrawModal
				modalType={modalType}
				positions={userPositions}
				setShowWithDrawModal={setShowWithDrawModal}
				showWithdrawModal={showWithdrawModal}
			/>
		</>
	);
};

export default DashboardClientPage;
