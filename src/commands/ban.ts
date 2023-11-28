import { EmbedBuilder, GuildMember, PermissionsBitField, Routes } from "discord.js";
import { Command, FinalResponse } from "../core/client";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Permission } from "../core/common/guilds/guildBase";
import { addAuditLogEvent, addGuildAction } from "../core/common/guilds/auditor";

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
    userPerms: [Permission.BanMembers],
    botPerms: [PermissionsBitField.Flags.BanMembers],
    interactionData: new SlashCommandBuilder()
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
	)
    .addStringOption((option) => option
        .setName("duration")
        .setDescription("How long should this ban last? Use '0' or leave blank for permanent. Defaults to permanent.")
    )
    .addStringOption((option) => option
        .setName("delete_messages_till")
        .setDescription("Delete messages until this many units prior. Defaults to 7d")
    ),
    execute: async (ctx) => {
        // @ts-expect-error
        const guildMember: GuildMember = ctx.interaction.options.getMember("user");
        if (!guildMember)
            return FinalResponse.reply({
                content: "This user is not an member of this guild.",
                ephemeral: true,
            });    
        
        const reason = ctx.interaction.options.getString("reason");
        const duration = parseDuration(ctx.interaction.options.getString("duration"))
        const deleteMessagesTill = parseDuration(ctx.interaction.options.getString("delete_messages_till"))

        let auditLogEntry = await addAuditLogEvent({
            type: "ban",
            userId: ctx.interaction.user.id,
            guildId: ctx.interaction.guild.id,
            data: {
                "target_id": guildMember.id,
                "via": "cmd:ban",
                "duration": duration,
                "delete_messages_till": deleteMessagesTill,
                "reason": reason
            }
        })

        let disallowDM = false;
        try {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Banned from ${ctx.interaction.guild.name}`)
                .setDescription(reason ?? "No reason specified.")
                .setAuthor({
                    name: ctx.client.user.displayName,
                    iconURL: ctx.client.user.displayAvatarURL(),
                })
                .setTimestamp();

            guildMember.send({ embeds: [embed] });
        } catch (error) {
            disallowDM = true;
        }     

        await guildMember?.ban({ 
            reason: reason,
            deleteMessageSeconds: deleteMessagesTill,
        });

        if(duration > 0) {
            await addGuildAction({
                type: "unban",
                userId: guildMember.id,
                guildId: ctx.interaction.guild.id,
                auditLogEntry,
                expiry: `${duration} seconds`,
                data: {
                    "via": "cmd:ban",
                    "duration": duration,
                    "reason": reason
                }
            })   
        }

        return FinalResponse.reply(
            {
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(
                            `Banned **${guildMember.user.tag}**${
                                disallowDM ? " (DMs disabled)" : ""
                            }`
                        )
                ]
            }
        )
    }
}

export default command;