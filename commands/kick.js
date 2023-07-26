const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kicks a user from the server")
		.addUserOption((user) =>
			user
				.setName("user")
				.setDescription("Who is the target user?")
				.setRequired(true)
		)
		.addStringOption((reason) =>
			reason
				.setName("reason")
				.setDescription("Why are you banning this user?")
		)
		.addBooleanOption((dm) =>
			dm
				.setName("dm_user")
				.setDescription(
					"Do you want the bot to notify the user that they were kicked from the server?"
				)
				.setRequired(true)
		),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(client, interaction, database) {
		const member = interaction.options.getMember("user");
		const user = interaction.options.getUser("user", true);
		const dmUser = interaction.options.get("dm_user");
		const reason = interaction.options.get("reason");

		if (dmUser.value) {
			if (member.kickable) {
				try {
					const embed = new EmbedBuilder()
						.setColor("Red")
						.setTitle(`Kicked from ${interaction.guild.name}`)
						.setAuthor({
							name: interaction.user.tag,
							iconURL: interaction.user.displayAvatarURL({
								dynamic: true,
							}),
						})
						.setTimestamp()
						.setDescription(reason || "No reason specified");

					member.send({ embeds: [embed] });
					member.kick(reason || "No reason specified.");

					await interaction.reply({
						content: `> **Success!** User has been kicked!`,
					});
				} catch (error) {
					await interaction.reply({
						content: `> **Action Failed!** Please try again or contact us at our Support Server by doing \`/support\`\n\n***Error:*** ${error}`,
					});
				}
			} else {
				await interaction.reply({
					content: `> **Failed!**\nThat User couldn't be kicked because it is server owner or has higher permissions than me.`,
				});
			}
		} else {
			if (member.kickable) {
				try {
					member.kick(reason);
				} catch (err) {
					interaction.reply({
						content: `> **Action Failed!** Please Try again or Contact us at our Support Server by doing \`/support\``,
					});
				}
			} else {
				interaction.reply({
					content: `> **Failed!**\nThat User couldn't be kicked because it is server owner or has higher permissions than me.`,
				});
			}
		}
	},
};
