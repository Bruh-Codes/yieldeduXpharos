"use client";
import { Dialog } from "@/components/ui/dialog";
import { Dispatch, SetStateAction } from "react";
import { useSearchParams } from "next/navigation";

import WithDrawScreen from "./WithDrawScreen";
import UnstakeScreen from "./UnstakeScreen";
import { ActivePosition } from "./PositionOverview";

const WithdrawModal = ({
	showWithdrawModal,
	setShowWithDrawModal,
	positions,
	modalType,
}: {
	showWithdrawModal: boolean;
	setShowWithDrawModal: Dispatch<SetStateAction<boolean>>;
	positions: ActivePosition[];
	modalType: "withdraw" | "unstake" | null;
}) => {
	const searchParams = useSearchParams();
	const positionId = searchParams.get("positionId");
	const position = positions.find((p) => Number(p.id) === Number(positionId));

	return (
		<Dialog
			modal={true}
			open={showWithdrawModal}
			onOpenChange={(state) => (
				window.history.pushState({}, "", `/dashboard`),
				setShowWithDrawModal(state)
			)}
		>
			{modalType === "withdraw" && (
				<WithDrawScreen
					owner={position?.positionAddress}
					transaction_hash={position?.transactionHash}
					amount={position?.amount}
					expectedYield={position?.expectedYield}
					position_id={positionId}
					setShowWithDrawModal={setShowWithDrawModal}
				/>
			)}
			{modalType === "unstake" && (
				<UnstakeScreen
					owner={position?.positionAddress}
					position_id={positionId}
					transaction_hash={position?.transactionHash}
					amount={position?.amount}
					setShowWithDrawModal={setShowWithDrawModal}
					expectedYield={position?.expectedYield}
				/>
			)}
		</Dialog>
	);
};

export default WithdrawModal;
