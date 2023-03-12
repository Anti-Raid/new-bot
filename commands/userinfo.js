const { SlashCommandBuilder } = require("@discordjs/builders");
const { Client, CommandInteraction, EmbedBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Check info about a user")
    .addUserOption((usr) =>
      usr
        .setName("user")
        .setDescription("The user you want info about.")
        .setRequired(true)
    ),
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {*} database
   */
  async execute(client, interaction) {
    const user = interaction.options.getUser("user", true);
    const member = interaction.options.getMember("user", true);
    const discord_info = await client
      .fetch(`https://api.antiraid.xyz/api/users/get?id=${user.id}`)
      .then((res) => res.json());
    const embed = new EmbedBuilder()
      .setColor(`${member.displayHexColor ?? `Aqua`}`)
      .setAuthor({
        name: `Userinfo For ${user.username}#${user.discriminator}`,
        url: `${member.displayAvatarURL({ dynamic: true })}`,
      })
      .setThumbnail(`${member.displayAvatarURL({ dynamic: true })}`)
      .addFields(
        {
          name: "Username",
          value: user.username,
          inline: true,
        },
        {
          name: "Discriminator",
          value: `#${user.discriminator}`,
          inline: true,
        },
        {
          name: "Member Joined At",
          value: `${member.joinedAt.toLocaleString("en-GB")}`,
          inline: true,
        },
        {
          name: "Created Account At",
          value: `${user.createdAt.toLocaleString("en-GB")}`,
          inline: true,
        },
        {
          name: "Nickname",
          value: member.nickname ?? "None.",
          inline: true,
        },
        {
          name: "Is it a Bot?",
          value: user.bot ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Server Roles",
          value: `> ${member.roles.cache
            .filter((s) => s.name !== "@everyone")
            .sort((a, b) => b.position - a.position)
            .map((r) => r)}`,
          inline: false,
        }
      );
    if (!user.bot) {
      embed.addFields({
        name: "Roles In AntiRaid",
        value: `> ${discord_info.roles
          .map((s) => {
            const string = [];
            const words = s.replaceAll("_", " ").toLowerCase().split(" ");

            words.forEach((word) => {
              string.push(word.charAt(0).toUpperCase() + word.slice(1));
            });

            return string.join(" ");
          })
          .join(", ")}`,
        inline: false,
      });
    }
    interaction.reply({ embeds: [embed] });
  },
};