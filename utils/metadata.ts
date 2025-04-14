import icon from "@/public/icon2.png";
import openGraphImage from "@/public/YieldEDU.png";
import { Metadata } from "next";

export const yieldEduMetadata: Metadata = {
	title: " YieldPharos",
	description:
		"A Web3 protocol that lets you earn guaranteed yields on your Pharos tokens while learning about Web3.",
	applicationName: " YieldPharos",
	icons: [icon.src],

	authors: [{ name: "Kamasah Dickson", url: "https://github.com/Bruh-Codes" }],
	keywords: [
		"Web3",
		"Yield",
		"Blockchain",
		"Crypto",
		"Pharos tokens",
		"Decentralized Finance",
		"Defi",
		"Guaranteed Yields",
		"educhain",
		"Defi Ai",
	],
	creator: "Kamasah Dickson",

	openGraph: {
		title: " YieldPharos",
		type: "website",
		emails: ["kamasahdickson@gmail.com"],
		siteName: " YieldPharos",
		description:
			"A Web3 protocol that lets you earn guaranteed yields on your  Pharos tokens while learning about Web3.",
		images: [openGraphImage.src, icon.src],
	},

	twitter: {
		card: "summary_large_image",
		title: " YieldPharos",
		description:
			"A Web3 protocol that lets you earn guaranteed yields on your Pharos tokens while learning about Web3.",
		images: [openGraphImage.src, icon.src],
		creator: "@bruh_codes",
	},
	metadataBase: new URL(process.env.NEXT_PUBLIC_WEBSITE_URL as string),

	category: "Defi",

	alternates: {
		canonical: process.env.NEXT_PUBLIC_WEBSITE_URL,
		languages: {
			"en-US": "/en-US",
		},
	},
};
