/* eslint-disable no-unused-vars */
/* eslint-disable no-unreachable */
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
	MessageEmbed,
	CommandInteraction,
	EmbedBuilder,
} = require("discord.js");
const moment = require("moment");
const ms = require("ms");
const osu = require("node-os-utils");
const os = require("os");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Shows bot stats")
		.addStringOption(
			(type) =>
				type
					.setName("type")
					.setDescription("Which stats to show")
					.addChoices(
						{ name: "General Information", value: "info" },
						{ name: "System Information", value: "system" }
					)
					.setRequired(true)
			// .addChoice("General information", "info")
			// .addChoice("System information", "system")
		),
	/**
	 * @param {CommandInteraction} interaction
	 */
	execute: async (client, interaction, database) => {
		const type = interaction.options.getString("type");
		const cpu = osu.cpu;
		const mem = osu.mem;
		// const guilds = await interaction.client.shard.broadcastEval('this.interaction.guilds.cache.size').then(x => x.reduce((a, b) => b + a));
		// const users = await interaction.client.shard.broadcastEval('this.interaction.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)').then(x => x.reduce((a, b) => b + a));
		// const channels = await interaction.client.shard.broadcastEval('this.interaction.guilds.cache.reduce((acc, guild) => acc + guild.channels.cache.size, 0)').then(x => x.reduce((a, b) => b + a));

		cpu.usage().then(async (cpuPercentage) => {
			mem.info().then(async (minfo) => {
				if (type === "info" || type === "information") {
					const embed = new EmbedBuilder()
						.setTitle(
							"Bot stats",
							interaction.client.user.displayAvatarURL({
								dynamic: true,
							})
						)
						.addFields([
							{
								name: "Name:",
								value: interaction.client.user.username,
								inline: true,
							},
							{
								name: "ID",
								value: interaction.client.user.id,
								inline: true,
							},
							{
								name: "Ping",
								value: interaction.client.ws.ping + " ms",
								inline: true,
							},
							{
								name: "Uptime",
								value: ms(interaction.client.uptime, {
									long: true,
								}),
								inline: true,
							},
							{
								name: "Servers",
								value: interaction.client.guilds.cache.size.toString(),
								inline: true,
							},
							{
								name: "Users",
								value: interaction.client.users.cache.size.toString(),
								inline: true,
							},
							{
								name: "Channels (Total)",
								value: interaction.client.channels.cache.size.toString(),
								inline: true,
							},
							{
								name: "Emojis",
								value: interaction.client.emojis.cache.size.toString(),
								inline: true,
							},
							{
								name: "Created At",
								value: moment(
									interaction.client.user.createdAt
								).format("dddd, MMMM Do YYYY, h:mm:ss a"),
								inline: true,
							},
							{
								name: "Last Restart",
								value: moment(
									interaction.client.readyAt
								).format("dddd. MMMM Do YYYY, h:mm:ss zz"),
								inline: true,
							},
						])
						.setThumbnail(
							interaction.client.user.displayAvatarURL()
						)
						.setColor("Blurple");
					interaction.reply({ embeds: [embed] });
				} else if (type === "system") {
					const embed = new EmbedBuilder()
						.setTitle(
							"System Information",
							interaction.client.user.displayAvatarURL({
								dynamic: true,
							})
						)
						.addFields([
							{
								name: "Operating System",
								value: `${process.platform} | ${os.release()}`,
								inline: true,
							},
							{
								name: `CPU`,
								value: cpuPercentage + "%",
								inline: true,
							},
							{
								name: "Memory",
								value: `**Used:** ${minfo.usedMemMb} MB\n**Free:** ${minfo.freeMemMb} MB\n**Total:** ${minfo.totalMemMb} MB`,
								inline: true,
							},
							{
								name: "Discord.JS",
								value: `v${require("discord.js").version}`,
								inline: true,
							},
							{
								name: "Node.JS",
								value: process.version,
								inline: true,
							},
						])
						.setThumbnail(
							interaction.client.user.displayAvatarURL()
						)
						.setColor("DARK_RED");
					interaction.reply({ embeds: [embed] });
				}
			});
		});
	},
};
