"use strict";

const { toNumber } = require("lodash");

module.exports = async ({ client, socket, provider, supply }) => {
	const { user, channels } = client;
	const { cache } = channels;

	const estate = cache.find(({ name }) => name === "created-images");
	const token = cache.find(({ name }) => name === "minted-cells");

	let total = toNumber((await provider.totalSupply()).toString());
	let percent = Math.round((100 * total) / supply);

	user.setActivity(`${total} Minted, %${percent}`, { type: "WATCHING" });

	socket
		.on("SetToken", (id, block, vertical, horizontal, owner) => {
			total = total + 1;
			percent = Math.round((100 * total) / supply);

			token.send(`${owner}\n${id} - ${block}:${vertical}:${horizontal}`);
			user.setActivity(`${total} Minted, %${percent}`, { type: "WATCHING" });
		})
		.on("SetEstate", (id, title, image, link) => {
			estate.send(`${title}\n${image}\n${link}`);
		});
};
