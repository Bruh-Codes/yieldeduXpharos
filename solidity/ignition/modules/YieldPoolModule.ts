import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YieldTokenModule from "./YieldTokenModule";

const YieldPoolModule = buildModule("YieldPoolModule", (m) => {
	const { YieldToken } = m.useModule(YieldTokenModule);

	const YieldPool = m.contract("YieldPool", [YieldToken, 10, 86400, 31536000]);

	return {
		YieldPool,
	};
});

export default YieldPoolModule;
