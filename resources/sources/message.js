"use strict";

const { MessageEmbed } = require("discord.js");
const jwt = require("jsonwebtoken");

module.exports = ({ response, secret, location, prefix }) => {
	if (response.content === prefix) {
		const key = jwt.sign(
			{ guild: response.guild.id, author: response.author.id },
			secret
		);

		response.author.send({
			embeds: [
				new MessageEmbed()
					.setTitle("Connect Your Account")
					.setDescription(
						"Connect your wallet, [click here](" + location + "/" + key + ")"
					),
			],
		});
	}
};
