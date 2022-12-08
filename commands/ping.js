const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Check the bot's ping"),
	async execute(client, interaction, database) {
		const reply = await interaction.reply({
			content: "",
			embeds: [
				new client.EmbedBuilder()
					.setColor("Orange")
					.setDescription(
						`Checking Discord Websocket Latency & Discord Interaction Roundtrip Latency...`
					),
			],
			fetchReply: true,
		});

		const interactionLatency = Math.round(
			reply.createdTimestamp - interaction.createdTimestamp
		);

		reply.edit({
			embeds: [
				new client.EmbedBuilder().setColor("Blue").addFields(
					{
						name: `Discord Websocket Latency`,
						value: `\`${interaction.client.ws.ping}\`ms`,
						inline: true,
					},
					{
						name: `Discord Interaction Roundtrip Latency`,
						value: `\`${interactionLatency}\`ms`,
						inline: true,
					}
				),
			],
		});
	},
    async autocomplete(client, interaction, database) {}
};
