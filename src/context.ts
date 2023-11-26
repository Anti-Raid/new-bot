import { EmbedBuilder, CommandInteraction, InteractionResponse, Message, InteractionDeferReplyOptions, AutocompleteInteraction } from "discord.js";
import { AntiRaid } from "./client";

export interface ContextReply {
    content?: string;
    embeds?: EmbedBuilder[];
    ephemeral?: boolean;
    fetchReply?: boolean;
}

export interface ContextEdit {
    content?: string;
    embeds?: EmbedBuilder[];
}

/**
 * Contains the current state of the reply
 */
export enum ContextReplyStatus {
    /**
     * The reply has not been sent yet
     */
    Pending,
    /**
     * The reply has been sent
     */
    Replied,
    /**
     * The reply has been deferred
     */
    Deferred,
}

export class CommandContext {
    client: AntiRaid;
    interaction: CommandInteraction
    private replyState: ContextReplyStatus = ContextReplyStatus.Pending;

    constructor(client: AntiRaid, interaction: CommandInteraction) {
        this.client = client;
        this.interaction = interaction;
    }

    public async reply(data: ContextReply): Promise<Message<boolean> | InteractionResponse<boolean>> {
        if(this.replyState != ContextReplyStatus.Pending) {
            return await this.interaction.followUp(data)
        }
        let res = await this.interaction.reply({
            content: data.content,
            embeds: data.embeds,
            ephemeral: data.ephemeral,
            fetchReply: data.fetchReply
        })

        this.replyState = ContextReplyStatus.Replied;

        return res
    }

    public async edit(data: ContextEdit) {
        await this.interaction.editReply({
            content: data.content,
            embeds: data.embeds,
        })
    }

    public async delete() {
        await this.interaction.deleteReply();
    }

    public async followUp(data: ContextReply) {
        if(this.replyState == ContextReplyStatus.Pending) {
            throw new Error("Cannot follow up before replying")
        }
        await this.interaction.followUp({
            content: data.content,
            embeds: data.embeds,
            ephemeral: data.ephemeral,
            fetchReply: data.fetchReply
        })
    }

    /**
     * Defers the reply to the interaction
     * @param options The options to defer the reply with
     */
    public async defer(options?: InteractionDeferReplyOptions) {
        if(this.replyState != ContextReplyStatus.Pending) {
            throw new Error("Cannot defer to an interaction that has already been responded to")
        }
        await this.interaction.deferReply(options);
    }
}

export class AutocompleteContext {
    client: AntiRaid;
    interaction: AutocompleteInteraction

    constructor(client: AntiRaid, interaction: AutocompleteInteraction) {
        this.client = client;
        this.interaction = interaction;
    }
}