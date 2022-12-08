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
	intents: [GatewayIntentBits.Guilds],
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
};

// Buttons
client.buttons = new Map();
const buttonFiles = fs
	.readdirSync("./buttons")
	.filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
	const button = require(`./buttons/${file}`);
	client.buttons.set(button.data.name.split("-")[0], button);
    buttonsTable.addRow(button.data.name, "✔", "Loaded");
}

// Modals
client.modals = new Map();
const modalFiles = fs
	.readdirSync("./modals")
	.filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
	const modal = require(`./modals/${file}`);
	client.modals.set(modal.data.name, modal);
    modalsTable.addRow(modal.data.name, "✔", "Loaded");
}

console.log(commandsTable.toString());
console.log(buttonsTable.toString());
console.log(modalsTable.toString());

// Discord Guild Member Update Event
client.on(Events.GuildMemberUpdate, async (oldInfo, newInfo) => {
	const allowedRoles = [
		{
			name: "Owner",
			mainGuild: "1008472299239903242",
			staffGuild: "1047781197738147882",
		},
		{
			name: "Administrator",
			mainGuild: "1001584270126633041",
			staffGuild: "1047781198539259914",
		},
		{
			name: "Staff Manager",
			mainGuild: "1028636226015739914",
			staffGuild: "1047781199235530764",
		},
		{
			name: "Developer",
			mainGuild: "1001629848596385833",
			staffGuild: "1047781199973724160",
		},
		{
			name: "Moderator",
			mainGuild: "1001584438314008777",
			staffGuild: "1047781200707735612",
		},
		{
			name: "Select Social Moderator",
			mainGuild: "1030233535941988505",
			staffGuild: "1047781201051660339",
		},
		{
			name: "Bot Reviewer",
			mainGuild: "1001610329379328101",
			staffGuild: "1047781202293170276",
		},
	];

	const staff = client.guilds.cache.find((s) => s.name === "SL Staff Center");

	// Sync new roles with staff server
	if (newInfo.guild.id === "1001583335191093278") {
		if (newInfo.user.bot || newInfo.user.system) return;
		else {
			const user = await staff.members.fetch(newInfo.id);

			if (user) {
				let newRoles = [];
				let oldRoles = [];

				newInfo.roles.cache
					.map((role) => role.id)
					.forEach((role) => {
						const roleData = allowedRoles.filter(
							(data) => data.mainGuild === role
						);

						if (!roleData[0]) return;
						else newRoles.push(roleData[0]);
					});

				oldInfo.roles.cache
					.map((role) => role.id)
					.forEach((role) => {
						const roleData = allowedRoles.filter(
							(data) => data.mainGuild === role
						);

						if (!roleData[0]) return;
						else oldRoles.push(roleData[0]);
					});

				if (newRoles.length > 0) {
					if (oldRoles.length > 0)
						oldRoles.forEach((p) => {
							const i = staff.roles.cache.get(p.staffGuild);
							user.roles
								.remove(i)
								.catch((err) =>
									logger.error("Discord (Role Sync)", err)
								);
						});

					newRoles.forEach((p) => {
						const i = staff.roles.cache.get(p.staffGuild);
						user.roles
							.add(i)
							.catch((err) =>
								logger.error("Discord (Role Sync)", err)
							);
					});
				}
			}
		}
	}

	// Add stuff to Database
	if (newInfo.guild.id === "1001583335191093278") {
		if (newInfo.user.bot || newInfo.user.system) return;
		else {
			const roles = [];

			newInfo.roles.cache
				.map((role) => role.id)
				.forEach((role) => {
					const roleData = allowedRoles.filter(
						(data) => data.mainGuild === role
					);

					if (!roleData[0]) return;
					else
						roles.push(
							roleData[0].name.toUpperCase().replaceAll(" ", "_")
						);
				});

			if (roles.length > 0) {
				const data = await database.User.getUser(newInfo.id);

				if (!data) return;
				else
					await database.User.updateUser(
						newInfo.id,
						newInfo.user.username,
						data.bio,
						newInfo.displayAvatarURL(),
						roles,
						data.flags,
						data.badges,
						data.onboarding,
						data.notifications
					);
			}
		}
	} else return;
});

// Discord Message Create Event
client.on(Events.MessageCreate, async (message) => {
	let allUsers = await database.User.listAll();

	allUsers.forEach(async (user) => {
		let sessions = user.onboarding;

		let session = sessions.filter(
			(session) => session.server_id === message.guild.id
		);
		if (!session[0]) return;

		if (sessions[0].uuid === session[0].uuid) {
			sessions[0].messages.push({
				user: `${message.author.username}#${message.author.discriminator}`,
				bot: message.author.bot,
				message: message.content,
				time: message.createdAt,
			});

			await database.User.updateUser(
				user.user_id,
				user.username,
				user.bio,
				user.avatar,
				user.roles,
				user.flags,
				user.badges,
				sessions,
				user.notifications
			);
		}
	});
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
