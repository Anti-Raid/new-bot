import { EmbedBuilder, GuildMember, GuildMemberRoleManager, PermissionsBitField, Routes } from "discord.js";
import { Command, FinalResponse } from "../core/client";
import { SlashCommandBuilder } from "@discordjs/builders";
import { addAuditLogEvent, addGuildAction, editAuditLogEvent } from "../core/common/guilds/auditor";
import sql from "../core/db";

const parseDuration = (duration: string | undefined): number => {
    if(!duration) {
        return 0
    }

    if(duration == "0") {
        return 0
    }

	var units = {
        // Days
        'days': 86400,
        'day': 86400,
        'd': 86400,
        // Hours
        'hours': 3600,
        'hour': 3600,
        'hrs': 3600,
        'hr': 3600,
        'h': 3600, 
        // Minutes
        'minutes': 60,
        'minute': 60,
        'mins': 60,
        'min': 60,
        'm': 60, 
        // Seconds
        'seconds': 1,
        'second': 1,
        'secs': 1,
        'sec': 1,
        's': 1
    };

    let seconds = 0;

    for (const [key, value] of Object.entries(units)) {
        let regex = new RegExp(`([0-9]+)${key}`, "i")
        let match = duration.match(regex)

        if(match) {
            let amount = parseInt(match[1])
            seconds += amount * value
        }
    }

	return seconds;
}

let command: Command = {
    userPerms: [PermissionsBitField.Flags.KickMembers],
    botPerms: [PermissionsBitField.Flags.KickMembers],
    interactionData: new SlashCommandBuilder()
	.setName("kick")
	.setDescription("Kicks a user from the server.")
	.addUserOption((option) => option
		.setName("user")
		.setDescription("Who is the target user?")
		.setRequired(true)
    )
	.addStringOption((option) => option
		.setName("reason")
		.setDescription("Why are you banning this user?")
        .setMaxLength(512)
	)
    .addStringOption((option) => option
        .setName("delete_messages_till")
        .setDescription("Delete messages until this many units prior. Defaults to 7d. Limited to 500 messages per channel.")
    ),
    execute: async (ctx) => {
        // @ts-expect-error
        const guildMember: GuildMember = ctx.interaction.options.getMember("user");
        if (!guildMember)
            return FinalResponse.reply({
                content: "This user is not an member of this guild.",
                ephemeral: true,
            });   
            
        // Ensure that the member can ban the target member
        if (guildMember.roles.highest.comparePositionTo((ctx.interaction.member.roles as GuildMemberRoleManager).highest) > 0) {
            return FinalResponse.reply({
                content: "You cannot kick this user as they have a higher role than you.",
                ephemeral: true,
            });
        }
        
        const reason = ctx.interaction.options.getString("reason");
        const deleteMessagesTill = parseDuration(ctx.interaction.options.getString("delete_messages_till") || "7d")

        // Ensure deleteMessagesTill is less than 2 weeks
        if(deleteMessagesTill > 1209600) {
            return FinalResponse.reply({
                content: "You cannot delete messages older than 2 weeks!",
                ephemeral: true,
            });
        }

        let disallowDM = false;
        await sql.begin(async sql => {
            let auditLogEntry = await addAuditLogEvent(sql, {
                type: "kick",
                userId: ctx.interaction.user.id,
                guildId: ctx.interaction.guild.id,
                data: {
                    "status": "pending",
                    "target_id": guildMember.id,
                    "via": "cmd:kick",
                    "delete_messages_till": deleteMessagesTill,
                    "reason": reason
                }
            })
    
            try {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`Kicked from ${ctx.interaction.guild.name}`)
                    .setDescription(reason ?? "No reason specified.")
                    .setAuthor({
                        name: ctx.client.user.displayName,
                        iconURL: ctx.client.user.displayAvatarURL(),
                    })
                    .setTimestamp();
    
                await guildMember.send({ embeds: [embed] });
            } catch (error) {
                disallowDM = true;
            }     
            
            try {
                await guildMember?.kick(`${ctx.interaction.user.username} [${ctx.interaction.user.id}]: ${reason ?? "No reason specified."}`);    
            
                if(deleteMessagesTill > 0) {
                    let channels = await ctx.interaction.guild.channels.fetch()

                    for (const [id, channel] of channels) {
                        if(!channel.isTextBased()) {
                            continue
                        }

                        let isNotDone = false
                        let tries = 0
                        let currentMessage = undefined    

                        while (!isNotDone && tries < 5) {
                            let messages = await channel.messages.fetch({ 
                                limit: 100,
                                ...(currentMessage ? { before: currentMessage.id } : {})
                            })

                            if(messages.size < 100) {
                                isNotDone = true
                            }

                            let messagesToDelete = messages.filter(message => message.author.id == guildMember.id && message.createdTimestamp > Date.now() - deleteMessagesTill * 1000)
                            
                            try {
                                await channel.bulkDelete(messagesToDelete)
                            } catch (err) {
                                ctx.client.logger.error(`Failed to delete messages in channel ${channel.id} in guild ${ctx.interaction.guild.id}. Error: ${err.message}`)
                            }

                            // Now set currentMessage to the message with the oldest timestamp
                            currentMessage = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first()
                        }
                    }    
                }
            } catch (err) {
                await editAuditLogEvent(sql, auditLogEntry, {
                    type: "kick",
                    userId: ctx.interaction.user.id,
                    guildId: ctx.interaction.guild.id,
                    data: {
                        "status": "failed",
                        "error": err.message,
                        "target_id": guildMember.id,
                        "via": "cmd:kick",
                        "delete_messages_till": deleteMessagesTill,
                        "reason": reason
                    }
                })    
                return FinalResponse.reply({
                    content: `Failed to kick **${guildMember.user.tag}**. Error: \`${err.message}\``,
                    ephemeral: true,
                });
            }

            await editAuditLogEvent(sql, auditLogEntry, {
                type: "kick",
                userId: ctx.interaction.user.id,
                guildId: ctx.interaction.guild.id,
                data: {
                    "status": "success",
                    "target_id": guildMember.id,
                    "via": "cmd:kick",
                    "delete_messages_till": deleteMessagesTill,
                    "reason": reason
                }
            })
        })

        return FinalResponse.reply(
            {
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(
                            `Kicked **${guildMember.user.tag}**${
                                disallowDM ? " (DMs disabled)" : ""
                            }`
                        )
                ]
            }
        )
    }
}

export default command;