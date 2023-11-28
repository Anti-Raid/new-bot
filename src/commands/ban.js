import { SlashCommandBuilder } from "@discordjs/builders";

export const data = new SlashCommandBuilder()
	.setName("ban")
	.setDescription("Ban a user from the server.")
	.addUserOption((option) => option
		.setName("user")
		.setDescription("Who is the target user?")
		.setRequired(true)
	)
	.addStringOption((option) => option
		.setName("reason")
		.setDescription("Why are you banning this user?")
	);
export
	/**
	 *
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @returns
	 */
	async function execute(client, interaction, database) {
	const reason = interaction.options.getString("reason") || "No reason provided.";

	if (!interaction.member.permissions.has("BAN_MEMBERS"))
		return interaction.reply({
			content: "You do not have permission to ban users.",
			ephemeral: true,
		});

	const guildMember = interaction.options.getMember("user");
	if (!guildMember)
		return interaction.reply({
			content: "This user is not an member of this guild.",
			ephemeral: true,
		});

	try {
		const disallowDM = false;

		try {
			const embed = new client.EmbedBuilder()
				.setColor("Red")
				.setTitle(`Banned from ${interaction.guild.name}`)
				.setDescription(reason ?? "No reason specified.")
				.setAuthor({
					name: interaction.user.tag,
					iconURL: interaction.user.displayAvatarURL({
						dynamic: true,
					}),
				})
				.setTimestamp();

			guildMember.send({ embeds: [embed] });
		} catch (error) {
			disallowDM = true;
		}

		await guildMember.ban({
			deleteMessageSeconds: 60 * 60 * 24 * 7,
			reason: reason,
		});

		return interaction.reply({
			content: `Success: ${user.tag} was banned from ${interaction.guild.name} for ${reason}!${disallowDM
					? "\n Error: The user was not notified, as they do not have Direct Messaging enabled."
					: ""}`,
		});
	} catch (error) {
		console.error(error);

		return interaction.reply({
			content: "Oops! An error has occurred while trying to ban the user.",
			ephemeral: true,
		});
	}
}
