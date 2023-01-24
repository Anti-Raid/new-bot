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
const ascii = require("ascii-table");

// Environment Variables
require("dotenv").config();

// Create Discord Client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
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

// Create ASCII Tables
const commandsTable = new ascii("Commands");
const buttonsTable = new ascii("Buttons");
const modalsTable = new ascii("Modals");

// Commands
client.commands = new Map();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
	commandsTable.addRow(command.data.name, "✔", "Loaded");
}

// Buttons
client.buttons = new Map();
// const buttonFiles = fs
// 	.readdirSync("./buttons")
// 	.filter((file) => file.endsWith(".js"));

// for (const file of buttonFiles) {
// 	const button = require(`./buttons/${file}`);
// 	client.buttons.set(button.data.name.split("-")[0], button);
// 	buttonsTable.addRow(button.data.name, "✔", "Loaded");
// }

// Modals
client.modals = new Map();
// const modalFiles = fs
// 	.readdirSync("./modals")
// 	.filter((file) => file.endsWith(".js"));

// for (const file of modalFiles) {
// 	const modal = require(`./modals/${file}`);
// 	client.modals.set(modal.data.name, modal);
// 	modalsTable.addRow(modal.data.name, "✔", "Loaded");
// }

console.log(commandsTable.toString());
// console.log(buttonsTable.toString());
// console.log(modalsTable.toString());

// Discord Guild Member Update Event
client.on(Events.GuildMemberUpdate, async (oldInfo, newInfo) => {
	let allowedRoles = [
		{ name: "[Staff] Staff Manager", id: "1064136387516964934" },
		{ name:"[Staff] Social Media Manager", id:"1064139010735362180"},
		{ name: "[Staff] Web Administrator", id: "1064139178448781454" },
		{ name: "[Staff] Server Support", id: "1064139991107772486" },
		{ name: "[Staff] Web Moderator", id: "1064139359797923900" },
		{ name: "[Staff] Developer", id: "1064136127835025458" },
		{ name: "[Staff] Cybersecurity Specialist", id: "1064140556818722878" },
		{ name: "[Staff] Server Administrator", id: "1064139633266532464" },
		{ name: "[Staff] Server Moderator", id: "1064136584968032277" },
		{ name: "[Staff] Web Support", id: "1064140162063405137" },
	];

	// Add stuff to Database
	if (newInfo.guild.id === "1064135068928454766") {
		if (newInfo.user.bot || newInfo.user.system) return;
		else {
			const roles = [];

			newInfo.roles.cache
				.map((role) => role.id)
				.forEach((role) => {
					const roleData = allowedRoles.filter(
						(data) => data.id === role
					);

					if (!roleData[0]) return;
					else
						roles.push(
							roleData[0].name.toUpperCase().replaceAll(" ", "_")
						);
				});

			if (roles.length > 0) {
				const data = await database.Users.getUser(newInfo.id);

				if (!data) return;
				else
					await database.Users.updateUser(
						data.userID,
						data.discordUser,
						data.guilds,
						data.notifications,
						data.staff_applications,
						roles
					);
			}
		}
	} else return;
});
// Guild member update event
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
	// Check if the member's nickname has changed
	if (oldMember.nickname !== newMember.nickname) {
	  oldMember.client.channels.cache.get("1064256469010219008").send({
		embeds: [new EmbedBuilder().setColor("Orange").setDescription(`***${newMember.user.tag}*** has changed their nickname to **${newMember.nickname}**`).setTimestamp()]
	  })
	}
  
	// Check if the member has been added or removed from any roles
	const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
	const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
	if (addedRoles.size > 0) {
	//   addedRoles.forEach(role => console.log(` - ${role.name}`));
	  oldMember.client.channels.cache.get("1064256469010219008").send({
		embeds: [new EmbedBuilder().setColor("Green").setDescription(`***${newMember.user.tag}*** has has been added the roles: \n**${addedRoles.map(role => `- ${role}`)}**`).setTimestamp()]
	  })
	}
	if (removedRoles.size > 0) {
	//   removedRoles.forEach(role => console.log(` - ${role.name}`));
	  oldMember.client.channels.cache.get("1064256469010219008").send({
		embeds: [new EmbedBuilder().setColor("Red").setDescription(`***${newMember.user.tag}*** has has been removed from roles: \n**${removedRoles.map(role => `- ${role}`)}**`).setTimestamp()]
	  })
	}
  });
  // Discord Message Events
  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
	// Ignore messages from other bots
	if (newMessage.author.bot) return;
  
	// Check if the message content has changed
	if (oldMessage.content !== newMessage.content) {
	  oldMessage.client.channels.cache.get("1064256469010219008").send({
		embeds: [new EmbedBuilder()
			.setColor("Orange")
			.setDescription(`***${newMessage.author.tag}*** edited their message in *${newMessage.channel.name}*\n**Old Message:** \n> ${oldMessage.content.substr(0, 1024)}\n**New Message:**\n> ${newMessage.content.substr(0, 1024)}`)
			.setTimestamp()]
	  })
	}
  });
  client.on(Events.MessageDelete, message => {
	// Ignore messages from other bots
	if (message.author.bot) return;
	// we will do snipes sometime

	oldMessage.client.channels.cache.get("1064256469010219008").send({
		embeds: [new EmbedBuilder()
			.setColor("Orange")
			.setDescription(`***${message.author.tag}*** has deleted their message in *${message.channel.name}*\n**Deleted Message: \n> ${message.content.substr(0, 1024)}`)
			.setTimestamp()]
	  })
  });
// Discord Interaction Event
client.on(Events.InteractionCreate, async (interaction) => {
	// Slash Command
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command)
			return interaction.reply(
				"It seems that the command you are looking for, does not exist at this time."
			);

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

		if (["⏮️", "◀️", "⏹️", "▶️", "⏭️"].includes(interaction.customId))
			return;
		else {
			if (!button)
				return interaction.reply(
					"It seems that the button that you are trying to use, has not been created yet."
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
	}

	// Modals
	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId);

		if (!modal)
			return interaction.reply(
				"It seems that the modal that you are trying to use, has not been created yet."
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
