// Packages
const {
	Client,
	GatewayIntentBits,
	ActivityType,
	codeBlock,
	EmbedBuilder,
	Events,
} = require("discord.js");
const fetch = require("node-fetch");
const fs = require("node:fs");
const logger = require("./logger");
const database = require("./database/handler");

// Environment Variables
require("dotenv").config();

// Create Discord Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
});

// Discord Client Additions
client.EmbedBuilder = EmbedBuilder;
client.codeBlock = codeBlock;
client.fetch = fetch;

// Discord Ready Event
client.once(Events.ClientReady, async () => {
	client.user.setActivity("Development of v6.0.0", {
		type: ActivityType.Watching,
	});

	client.user.setStatus("dnd");

	logger.success("Discord", `Connected as ${client.user.username}!`);
});

// Discord Debug Event
client.on(Events.Debug, (info) => logger.debug("Discord", info));

// Discord Error Event
client.on(Events.Error, (error) => logger.error("Discord", error));

// Commands
client.commands = new Map();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Buttons
client.buttons = new Map();
const buttonFiles = fs
	.readdirSync("./buttons")
	.filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
	const button = require(`./buttons/${file}`);
	client.buttons.set(button.data.name.split("-")[0], button);
}

// Modals
client.modals = new Map();
const modalFiles = fs
	.readdirSync("./modals")
	.filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
	const modal = require(`./modals/${file}`);
	client.modals.set(modal.data.name, modal);
}

// Guild member update event
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
	// Check if the member's nickname has changed
	if (oldMember.nickname !== newMember.nickname) {
		const guild = await database.getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Orange")
			.setDescription(
				`***${newMember.user.tag}*** has changed their nickname to **${newMember.nickname}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}

	// Check if the member has been added or removed from any roles
	const addedRoles = newMember.roles.cache.filter(
		(role) => !oldMember.roles.cache.has(role.id)
	);
	const removedRoles = oldMember.roles.cache.filter(
		(role) => !newMember.roles.cache.has(role.id)
	);

	if (addedRoles.size > 0) {
		const guild = await database.getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Green")
			.setDescription(
				`***${
					newMember.user.tag
				}*** has been given the roles: \n**${addedRoles.map(
					(role) => `- ${role}`
				)}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}

	if (removedRoles.size > 0) {
		const guild = database.getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Red")
			.setDescription(
				`***${
					newMember.user.tag
				}*** has has been removed from roles: \n**${removedRoles.map(
					(role) => `- ${role}`
				)}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}
});

// Discord Message Events
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
	// Ignore messages from other bots
	if (newMessage.author.bot) return;

	// Check if the message content has changed
	if (oldMessage.content !== newMessage.content) {
		const guild = await database.getGuild(oldMessage.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Orange")
			.setDescription(
				`***${newMessage.author.tag}*** edited their message in *${
					newMessage.channel.name
				}*\n**Old Message:** \n> ${oldMessage.content.substr(
					0,
					1024
				)}\n**New Message:**\n> ${newMessage.content.substr(0, 1024)}`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}
});

client.on(Events.MessageDelete, async (message) => {
	// Ignore messages from other bots
	if (message.author.bot) return;

	const guild = await database.getGuild(oldMember.guild.id);
	const embed = new EmbedBuilder()
		.setColor("Orange")
		.setDescription(
			`***${message.author.tag}*** has deleted their message in *${
				message.channel.name
			}*\n**Deleted Message: \n> ${message.content.substr(0, 1024)}`
		)
		.setTimestamp();

	if (guild) client.channels.cache.get(guild.audit).send({ embeds: [embed] });
});

// Discord Interaction Event
client.on(Events.InteractionCreate, async (interaction) => {
	// Slash Command
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command)
			return interaction.reply("I'm sorry, that command does not exist.");

		try {
			await command.execute(client, interaction, database);
		} catch (error) {
			logger.error(`Command (${interaction.commandName})`, error);

			interaction.reply(
				`An error has occured.\n\n${codeBlock("js", error)}`
			);
		}
	}

	// Buttons
	if (interaction.isButton()) {
		const button = client.buttons.get(interaction.customId.split("-")[0]);

		if (!button)
			return interaction.reply(
				"I'm sorry, it seems that the button that you are attempting to use has not been created yet."
			);

		try {
			await button.execute(client, interaction, database);
		} catch (error) {
			logger.error(`Button (${interaction.customId})`, error);

			interaction.reply(
				`An error has occured.\n\n${codeBlock("js", error)}`
			);
		}
	}

	// Modals
	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId);

		if (!modal)
			return interaction.reply(
				"I'm sorry, it seems that the modal that you are trying to use has not been created yet."
			);

		try {
			await modal.execute(client, interaction, database);
		} catch (error) {
			logger.error(`Modal (${interaction.customId})`, error);

			interaction.reply(
				`An error has occured.\n\n${codeBlock("js", error)}`
			);
		}
	}

	// Autocomplete
	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(
			interaction.commandName
		);
		if (!command)
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				"Command does not exist"
			);

		try {
			await command.autocomplete(interaction, database);
		} catch (error) {
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				error
			);
		}
	}
});

// Login to Discord
client.login(process.env.TOKEN);
