const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the ban.')),
/**
 * 
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 * @returns 
 */
  async execute(client, interaction) {
    const user = interaction.options.get('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    if (!interaction.member.permissions.has('BAN_MEMBERS')) {
      return interaction.reply({ content: 'You do not have permission to ban users.', ephemeral: true });
    }

    const guildMember = interaction.options.getMember("user");
    if (!guildMember) {
      return interaction.reply({ content: 'This user is not aS member of this guild.', ephemeral: true });
    }

    try {
        try {
            guildMember.send({embeds: [   
                new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Banned from ${interaction.guild.name}`)
                .setAuthor({
                  name: interaction.user.tag,
                  iconURL: interaction.user.displayAvatarURL({
                    dynamic: true,
                  }),
                })
                .setTimestamp()
                .setDescription(reason ?? "No reason specified"),]})
        } catch(error){
            interaction.reply({content: `Member Banned but message could not be delivered.`})
        }
      await guildMember.ban({deleteMessageSeconds: 60*60*24*7, reason: reason});
      return interaction.reply(`Banned ${user.tag} for: ${reason}`);
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'An error occurred while trying to ban the user.', ephemeral: true });
    }
  },
};