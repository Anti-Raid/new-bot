const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
require('dotenv').config();
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setPresence({
		activities: { type: ActivityType.Watching, name: 'In Development v6.0.0-alpha' }
	});
});

client.login(process.env.token);
