import type { Metadata } from "next";
import { Inter } from "next/font/google";
import YieldEDUIcon from "@/public/icon2.png";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/DashboardHeader";
// import Loading from "../loading";
const inter = Inter({
	variable: "--font-inter",
	subsets: [
		"latin",
		"cyrillic",
		"latin-ext",
		"vietnamese",
		"cyrillic-ext",
		"greek",
		"latin",
	],
	weight: "400",
});

export const metadata: Metadata = {
	title: "YieldEDU - Earn Guaranteed Yields",
	description:
		"A decentralized fixed-yield protocol that earns users guaranteed yields on their Pharos tokens.",
	icons: [YieldEDUIcon.src],
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className={inter.className}>
			{/* Animated background - only visible in dark mode */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none dark:block hidden bg-gradient-animated bg-400 animate-gradient">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1A103D,#0A0B1E)]"></div>
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
				<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
			</div>
			<Header />
			<div className="flex w-full h-full">
				<Sidebar />
				<main className="flex flex-col w-full flex-1 px-5 h-screen overflow-y-auto">
					<div className="mt-24 space-y-6">{children}</div>
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
