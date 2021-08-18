"use strict";

const { MessageEmbed } = require("discord.js");
const jwt = require("jsonwebtoken");
const gql = require("graphql-tag");
const { ethers } = require("ethers");
const { size, isNil } = require("lodash");

const query = gql`
	query tokens($address: String!) {
		tokens(where: { owner: $address }) {
			id
		}
	}
`;

module.exports = ({ request, response, client, graph, secret, roles }) => {
	jwt.verify(request.body.message, secret, async (error, data) => {
		const { message, signature } = request.body;

		if (!!error === true) {
			return response.status(403).send("verify");
		} else if (isNil(message) === true) {
			return response.status(403).send("message");
		} else if (isNil(signature) === true) {
			return response.status(403).send("signature");
		}

		const address = ethers.utils.verifyMessage(message, signature);
		const result = await graph.query({ query, variables: { address } });

		const count = size(result.data.tokens);
		const index = Object.keys(roles).reduce(
			(y, x) => (count >= x ? x : y),
			null
		);

		if (isNil(roles[index]) === true) {
			return response.status(404).send("role");
		}

		const guild = client.guilds.cache.get(data.guild);
		const member = await guild.members.fetch(data.author);
		const role = guild.roles.cache.find(({ name }) => name == roles[index]);

		Object.values(roles).forEach((value) => {
			value = guild.roles.cache.find(({ name }) => name == value);

			if (member.roles.cache.has(value.id) === true) member.roles.remove(value);
		});

		member.roles.add(role);
		member.send({
			embeds: [
				new MessageEmbed()
					.setTitle("You Have a New Role")
					.setDescription("You have **" + roles[index] + "** role right now."),
			],
		});

		response.send({
			guild: data.guild,
			author: data.author,
			role: role.id,
		});
	});
};
