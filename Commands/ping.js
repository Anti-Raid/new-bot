const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, EmbedBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's ping"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	run: async (interaction, database, fetch) => {
		const message = await interaction.reply({
            content: "",
			embeds: [new EmbedBuilder().setColor('Orange').setDescription(`Checking Discord Websocket Latency & Discord Interaction Roundtrip Latency...`)],
            fetchReply: true,
        });
        const interactionLatency = Math.round(
            message.createdTimestamp - interaction.createdTimestamp
        );

		
		message.edit({
			embeds: [
				new EmbedBuilder().setColor('Blue').addFields({
					name: `Discord Websocket Latency`,
					value: `\`${interaction.client.ws.ping}\`ms`,
					inline: true
				}, {
					name: `Discord Interaction Roundtrip Latency`,
					value: `\`${interactionLatency}\`ms`,
					inline:true
				})
			]
		});
	}
};
