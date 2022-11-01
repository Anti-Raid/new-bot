const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const fetch = require('node-fetch');
require('dotenv').config();
const { readdirSync } = require('fs');
const { join } = require('path');
const loadersPath = join(__dirname, 'Handlers');
client.commands = new Collection();
client.aliases = new Collection();
client.events = new Collection();
for (const loaderFile of readdirSync(loadersPath).filter((cmdFile) => cmdFile.endsWith('.js'))) {
	const loader = require(`${loadersPath}/${loaderFile}`);
	loader.run(client);
}
client.login(process.env.token);
