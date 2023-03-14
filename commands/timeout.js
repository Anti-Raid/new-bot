const { SlashCommandBuilder } = require("@discordjs/builders");
const { Client, CommandInteraction, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("timeout")
		.setDescription("Timeout a user for a specified duration.")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to be timed out.")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("The reason for the timeout.")
				.setMaxLength(1024)
				.setRequired(true)
		)
		.addNumberOption((option) =>
			option
				.setName("days")
				.setDescription("Number of days")
				.setMinValue(0)
				.setRequired(false)
		)
		.addNumberOption((option) =>
			option
				.setName("hours")
				.setDescription("Number of hours")
				.setMinValue(0)
				.setRequired(false)
		)
		.addNumberOption((option) =>
			option
				.setName("minutes")
				.setDescription("Number of minutes")
				.setMinValue(0)
				.setRequired(false)
		)
		.addNumberOption((option) =>
			option
				.setName("seconds")
				.setDescription("Number of seconds")
				.setMinValue(0)
				.setRequired(false)
		),
	/**
	 *
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @returns
	 */
	async execute(client, interaction) {
		const member = interaction.options.getMember("user");
		const user = interaction.options.getUser("user");
		const days = interaction.options.getNumber("days") || 0;
		const hours = interaction.options.getNumber("hours") || 0;
		const minutes = interaction.options.getNumber("minutes") || 0;
		const seconds = interaction.options.getNumber("seconds") || 0;
		const totalSeconds =
			days * 86400 + hours * 3600 + minutes * 60 + seconds;
		const reason = interaction.options.getString("reason");
		if (totalSeconds === 0) {
			member.timeout(
				null,
				"Timeout Removed | Removed by " + interaction.user.tag
			);
		}
		if (member.manageable || member.moderatable) {
			member.timeout(
				totalSeconds * 1000,
				`${reason} | Issued by: ${interaction.user.tag}`
			);
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("DarkRed")
						.setAuthor({
							name: `${interaction.user.tag} | ${interaction.guild.name} (${interaction.guild.nameAcronym})`,
							iconURL: user.displayAvatarURL({ dynamic: true }),
						})
						.setDescription(
							`${user.tag} Timed out for ${require("ms")(
								totalSeconds * 1000,
								{ long: true }
							)}`
						)
						.setTimestamp(),
				],
			});
		} else {
			return interaction.reply({
				content: `${user.tag} couldn't be timeouted. Check if i have the permissions to timeout him/her.`,
			});
		}
	},
};
