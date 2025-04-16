import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: " YieldPharos",
		short_name: " YieldPharos",
		description:
			"The Web3 protocol that lets you earn guaranteed yields on your Pharos tokens while learning about Web3.",
		start_url: "/",
		display: "standalone",
		background_color: "#f0f4f8",
		theme_color: "#131D45",
		scope: "/",
		screenshots: [
			{
				src: "/yieldedu-screenshot1.png",
				type: "image/png",
				sizes: "1896x812",
				form_factor: "wide",
			},
		],
		icons: [
			{
				src: "/icon.png",
				sizes: "200x200",
				type: "image/png",
			},
		],
	};
}
