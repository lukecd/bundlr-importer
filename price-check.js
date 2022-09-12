// import the client
import Bundlr from "@bundlr-network/client";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

/**
 * @notice Script to check the price of variously sized files when uploaded
 * to the Bundlr permaweb.
 */
async function main() {
	// initialise a bundlr client
	// NOTE: The online example (https://docs.bundlr.network/docs/client/examples/full-example)
	// uses the following: bundlr = new Bundlr(...) which throws an error.
	// To run properly from node, you need to change to the version I have below.
	// This is documented here https://github.com/Bundlr-Network/js-sdk/issues/50
	const bundlr = new Bundlr.default("http://node1.bundlr.network", "matic", process.env.PRIVATE_KEY);

	// Hardcoded the MATIC price here to make things easy. Make sure to manually update
	// when running to get an accurate USD cost.
	const MATIC_PRICE = 0.885502;

	// files to check price of
	const filesToUpload = [
		"Greeter.sol",
		"README.md",
		"colors.png",
		"mallet-mellow-A3.mp3",
		"Space.png",
		"CryptoPunks.png",
		"CoffeeExchange.jpg",
		"CoffeeExchange.png",
	];
	const baseURL = "./price-check/";
	let prices = [];
	prices.push(["File", "Size (bytes)", "Cost (Matic)", "Cost (USD)"]);

	for (let i = 0; i < filesToUpload.length; i++) {
		const data = fs.readFileSync(baseURL + filesToUpload[i]);

		// create a Bundlr Transaction
		const tx = bundlr.createTransaction(data);

		// want to know how much you'll need for an upload? simply:
		// get the number of bytes you want to upload
		const size = tx.size;

		// query the bundlr node to see the price for that amount
		let cost = await bundlr.getPrice(size);
		cost = bundlr.utils.unitConverter(cost).toString();
		let usdCost = cost * MATIC_PRICE;

		prices.push([filesToUpload[i], size, cost, usdCost]);
	}

	console.table(prices);
}
main();
