// import the client
import Bundlr from "@bundlr-network/client";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

/**
 * @notice script to upload a series of files to the Bundlr network
 * Currently configured to use the devnet. It's free to use the Devnet,
 * but files are only archived for a 7 days.
 */
const main = async () => {
	// initialise a bundlr client
	// NOTE: The online example (https://docs.bundlr.network/docs/client/examples/full-example)
	// uses the following: bundlr = new Bundlr(...) which throws an error.
	// To run properly from node, you need to change to the version I have below new Bundlr.default().
	// This is documented here https://github.com/Bundlr-Network/js-sdk/issues/50
	const bundlr = new Bundlr.default("https://devnet.bundlr.network", "matic", process.env.PRIVATE_KEY, {
		providerUrl: process.env.MUMBAI_RPC,
	});

	// get account balance
	const balance = await bundlr.getLoadedBalance();
	console.log("account balance=", balance.toString());

	// convert it into decimal units
	const decimalBalance = bundlr.utils.unitConverter(balance);
	console.log("decimalBalance=", decimalBalance.toString());

	// List all file names to upload here
	const filesToUpload = ["", ""];
	// prefix for file names
	const baseURL = "./_____";

	// iterate over file names and upload one at a time
	for (let i = 0; i < filesToUpload.length; i++) {
		const data = fs.readFileSync(baseURL + filesToUpload[i]);

		// create a Bundlr Transaction
		const tx = bundlr.createTransaction(data);

		// want to know how much you'll need for an upload? simply:
		// get the number of bytes you want to upload
		const size = tx.size;

		// query the bundlr node to see the price for that amount
		const cost = await bundlr.getPrice(size);
		console.log("cost= ", cost.toString());
		console.log("decimal cost= ", bundlr.utils.unitConverter(cost).toString());

		// do we need more money?
		// Lazy fund the wallet, meaning each time we check how much to add and then add it
		// An alternative would be to first estimate cost (see price-check.js) and then
		// fund the account for all files at once.
		// According to the docs, "this approach only works effectively for currencies with
		// fast confirmation times like SOL, MATIC etc."
		// Depending on your funding currency, you may have to fund in advance
		if (balance.isGreaterThan(cost)) {
			console.log("funding wallet");
			// NOTE: The online example at https://docs.bundlr.network/docs/client/examples/funding-your-account
			// does not use Math.ceil(), and results in an error saying "must use an integer for funding amount".
			// I added Math.ceil() to round up, making sure we always have plenty of dev funds.
			await bundlr.fund(Math.ceil(balance.minus(cost).multipliedBy(1.1)));
		}

		// sign the transaction
		await tx.sign();

		// get the transaction's ID:
		const id = tx.id;

		// upload the transaction
		const result = await tx.upload();

		// and voila!
		console.log(`${filesToUpload[i]} available at https://arweave.net/${id}`);
	}
};

main();
