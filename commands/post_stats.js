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
  async execute(client, interaction) {
    const servers = interaction.client.guilds.cache.size;

    // Infinity Bot List
    const poster = new InfinityBots(
      "M6OOKtJ612sh2DpvvI75525dbnihs380Lv9KVlv418KBLlZizXnroVWkE29p20gjyJvPvD7T7Ynt7KCpkDzBCqiZBDV4QB1PrSBc",
      interaction.client.user.id
    );

    const infinity = await poster.postBotStats({
      servers: servers,
      shards: "0",
    });

    // Select List
    const selectlist = await fetch(
      `https://api.select-list.xyz/api/bots/stats?id=${interaction.client.user.id}&servers=${servers}&shards=0&token=caaa45e2-ee72-43a2-81d1-f675a50a998d`,
      {
        method: "POST",
      }
    ).then((res) => res.json());

    interaction.reply({
      content: `Posted bot statistics to:\n\t- Infinity Bot List\n\t- Select List (${JSON.stringify(
        selectlist
      )})`,
    });
  },
};
