const { Client } = require("discord.js");
const { InMemoryCache } = require("apollo-cache-inmemory");
const { createHttpLink } = require("apollo-link-http");
const { ApolloClient } = require("apollo-client");

const { ethers } = require("ethers");
const { readFileSync } = require("fs");
const bodyParser = require("body-parser");
const express = require("express")();
const cors = require("cors");
const fetch = require("node-fetch");

const ready = require("./resources/sources/ready");
const message = require("./resources/sources/message");
const promote = require("./resources/sources/promote");

const {
	DYNO: dyno,
	DISCORD_SECRET: token,
	DISCORD_PREFIX: prefix,
	DISCORD_OBJECTS: objects,
	NETWORK_SECRET: secret,
	NETWORK_EXPLORER: explorer,
	NETWORK_LOCATION: location,
	SERVICE_CONTRACT: contract,
	SERVICE_PROVIDER: provider,
	SERVICE_SOCKET: socket,
	INTERFACE_SUPPLY: supply,
} = process.env;

const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const link = createHttpLink({ uri: explorer, fetch: fetch });
const graph = new ApolloClient({ link, cache: new InMemoryCache() });
const Service = readFileSync("resources/interfaces/Service.json").toString();

express.use(cors());
express.use(bodyParser.json());
express.use(bodyParser.urlencoded({ extended: true }));

if (dyno === "web.1") {
	client.once("ready", () =>
		express.post("/", (request, response) =>
			promote({
				request,
				response,
				client,
				graph,
				secret,
				roles: objects
					.split(",")
					.reduce((y, x) => ({ ...y, [x.split(":")[0]]: x.split(":")[1] }), {}),
			})
		)
	);
} else {
	client.once("ready", () =>
		ready({
			client,
			socket: new ethers.Contract(
				contract,
				Service,
				new ethers.providers.WebSocketProvider(socket)
			),
			provider: new ethers.Contract(
				contract,
				Service,
				new ethers.providers.JsonRpcProvider(provider)
			),
			supply,
		})
	);

	client.on("messageCreate", (response) =>
		message({ response, secret, location, prefix })
	);
}

express.listen(process.env.PORT || 3000);
client.login(token);
