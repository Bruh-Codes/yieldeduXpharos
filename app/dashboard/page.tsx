"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Percent, Vault, Coins } from "lucide-react";
// import DepositForm from "@/components/DepositForm";

import { useBalance, useReadContract } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { getYieldPoolConfig, YieldTokenAddress } from "@/lib/utils";
import { formatEther } from "viem";
import { useState } from "react";
// import FaucetButton from "@/components/ui/FaucetButton";
import WithdrawModal from "@/components/WithdrawModal";
import AchievementBanner from "@/components/AchievementBanner";
import StakingCard from "@/components/StakingCard";
import PositionOverview from "@/components/PositionOverview";
// import Performance from "@/components/Performance";
import ActivePositions from "@/components/ActivePositions";
import usePositions from "@/hooks/usePositions";
import AddToAllowedTokens from "@/components/AddToAllowedTokens";
import Performance from "@/components/Performance";

const FixedYieldDashboard = () => {
	const { address } = useAppKitAccount();
	const { positions } = usePositions();

	const [modalType, setModalType] = useState<"withdraw" | "unstake" | null>(
		null
	);
	const [showWithdrawModal, setShowWithDrawModal] = useState(false);
	// const [showModal, setShowModal] = useState(false);
	const results = useBalance({
		address: address as unknown as `0x${string}`,
		token: YieldTokenAddress,
	});

	const { data: tvl } = useReadContract({
		...getYieldPoolConfig("getTotalValueLocked", []),
	});

	const formattedTVL = tvl ? formatEther(BigInt(tvl.toString())) : "0.00";

	const { data: totalStakers } = useReadContract({
		...getYieldPoolConfig("getTotalStakers", []),
	});

	// Base APY from YieldPool's YIELD_RATE
	const BASE_APY = 10;

	const { data } = useReadContract({
		...getYieldPoolConfig("getAllowedTokens", []),
	});
	const allowedTokens = (data as string[]) || [];

	return (
		<>
			{/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            
                            <div className="flex gap-4">
                                <FaucetButton userAddress={address} />
                            </div>
                        </div> */}
			{/* className="" */}
			<AchievementBanner />
			{address === process.env.NEXT_PUBLIC_OWNER_ADDRESS && (
				<AddToAllowedTokens />
			)}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
					<div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-10"></div>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="p-3 bg-sky-500/20 rounded-xl">
								<ShieldCheck className="size-8 text-sky-400" />{" "}
							</div>
							<div>
								<p className="text-md text-slate-400">TVL</p>
								<p className="text-4xl font-bold text-sky-400">
									{parseFloat(formattedTVL).toFixed(2)} FYT
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
								<p className="text-4xl font-bold text-sky-400">{BASE_APY}%</p>
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
								<p className="text-md text-slate-400">Allowed Tokens</p>
								<p className="text-4xl font-bold text-sky-400">
									{allowedTokens.length}
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
								<p className="text-4xl font-bold text-sky-400">
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
								<p className="text-md text-slate-400">Token Balance (FYT)</p>
								<p className="text-4xl font-bold text-sky-400">
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
					positions={positions}
					setShowWithDrawModal={setShowWithDrawModal}
				/>
			</div>
			<ActivePositions
				setModalType={setModalType}
				setShowWithDrawModal={setShowWithDrawModal}
				positions={positions}
			/>
			<Performance />

			<WithdrawModal
				modalType={modalType}
				setModalType={setModalType}
				positions={positions}
				setShowWithDrawModal={setShowWithDrawModal}
				showWithdrawModal={showWithdrawModal}
			/>
		</>
	);
};

export default FixedYieldDashboard;
