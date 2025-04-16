import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";
const INITIAL_OWNER = vars.get("ACCOUNT_ADDRESS");

if (!INITIAL_OWNER) {
	throw new Error(
		"Please set the INITIAL_OWNER variable by running `npx hardhat vars set INITIAL_OWNER`"
	);
}

const YieldTokenModule = buildModule("YieldTokenModule", (m) => {
	const YieldToken = m.contract("YieldToken", [
		INITIAL_OWNER,
		"Fixed Yield Token",
		"FYT",
	]); //constructor args

	return { YieldToken };
});

export default YieldTokenModule;
