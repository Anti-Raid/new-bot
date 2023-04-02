const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, EmbedBuilder } = require("discord.js");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("poststats")
		.setDescription("Posts the bot servers and shards to botlists"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(client, interaction, database) {
		const servers = interaction.client.guilds.cache.size;
		const users = interaction.client.users.cache.size;

		await fetch("https://spider.infinitybots.gg/bots/stats", {
			method: "POST",
			body: JSON.stringify({
				servers,
				users,
			}),
			headers: {
				Authorization:
					"iqMQydWCMxIEHYdupmJbFnsAtsLoNWsGDvethwZFlhOnywxmbQrIiQglVGjqbQXnmfsKhRUoWHOCQDPIMJibfUMiDXsTgMWuSXFJftiMKexYaSZmwWVKbDpzLhbVwgfO",
			},
		});

		/* Select List
    const selectlist = await fetch(
      `https://api.select-list.xyz/api/bots/stats?id=${interaction.client.user.id}&servers=${servers}&shards=0&token=caaa45e2-ee72-43a2-81d1-f675a50a998d`,
      {
        method: "POST",
      }
    ).then((res) => res.json());*/

		interaction.reply({
			content: `Posted bot statistics to:\n\t- Infinity Bot List`,
		});
	},
};
