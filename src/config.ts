import { parse } from 'yaml'
import { readFileSync } from "node:fs"

export interface BotListAction {
    enabled: boolean,
    interval: number,
    url_format: string // Must be u#{url}?[key1]={key2} (brackets means that anything can be substituted in)
    data_format?: { [key: string]: string }
}

export interface BotList {
    name: string,
    api_url: string,
    api_token: string,
    auth_format: string, // Can be one of h#[header]/{token} or u#[token]={token} or b#[key]={token} (brackets means that anything can be substituted in)
    post_stats?: BotListAction
}

interface Config {
    client_id: string,
    token: string,
    bot_lists: BotList[]
}

const loadConfig = (): Config => {
    let parsed = parse(readFileSync("./config.yaml").toString('utf-8'))

    if(!parsed.client_id) throw new Error("client_id is required in config.yaml")
    if(!parsed.token) throw new Error("token is required in config.yaml")
    if(!parsed.bot_lists) throw new Error("bot_lists is required in config.yaml")

    for (const botList of parsed.bot_lists) {
        if(!botList.name) throw new Error("name is required in bot_lists in config.yaml")
        if(!botList.api_url) throw new Error("api_url is required in bot_lists in config.yaml")
        if(!botList.api_token) throw new Error("api_token is required in bot_lists in config.yaml")
        if(!botList.auth_format) throw new Error("auth_format is required in bot_lists in config.yaml")

        if(botList.post_stats) {
            if(!botList.post_stats.enabled) throw new Error("post_stats.enabled is required in bot_lists in config.yaml as post_stats is defined")
            if(!botList.post_stats.interval) throw new Error("post_stats.interval is required in bot_lists in config.yaml as post_stats is defined")
            if(!botList.post_stats.url_format) throw new Error("post_stats.url_format is required in bot_lists in config.yaml as post_stats is defined")
            if(!botList.post_stats.data_format) throw new Error("post_stats.data_format is required in bot_lists in config.yaml as post_stats is defined")
        }
    }

    return {
        client_id: parsed.client_id,
        token: parsed.token,
        bot_lists: parsed.bot_lists
    }
}

export const config: Config = loadConfig();