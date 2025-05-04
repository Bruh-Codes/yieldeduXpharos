import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";

const INITIAL_OWNER = vars.get("ACCOUNT_ADDRESS");

if (!INITIAL_OWNER) {
	throw new Error(
		"Please set the INITIAL_OWNER variable by running `npx hardhat vars set INITIAL_OWNER`"
	);
}

const BorrowProtocolModule = buildModule("BorrowProtocolModule", (m) => {
	const BorrowProtocol = m.contract("BorrowProtocol", [
		"0x835E7250A4E2ffc56F14AA171F0086Bc60A6D4eA",
		"0x8D6444887c22Eb1A32De4299E507C62EbAb4004A",
		INITIAL_OWNER,
	]);

	return { BorrowProtocol };
});

export default BorrowProtocolModule;
