import { AntiRaid } from "../client"
import { getServerCount, getShardCount } from "./counts"

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

export function validateAction(action: BotListAction) {
    if(!action.enabled) throw new Error("<action>.enabled is required in bot_lists in config.yaml")
    if(!action.interval) throw new Error("<action>.interval is required in bot_lists in config.yaml")
    if(!action.url_format) throw new Error("<action>.url_format is required in bot_lists in config.yaml")
}

function parseHeader(header: string, variables: { [key: string]: any }) {
    let parsed = header;
    for (const key in variables) {
        parsed = parsed.replaceAll(`{${key}}`, variables[key]);
    }
    return parsed;
}

function createData(botList: BotList, action: BotListAction, variables: { [key: string]: any }) {
    let [mod, format, ...ext] = action.url_format.split("#");

    if(mod != "u") {
        throw new Error("Only u# is supported for url_format in bot_lists in config.yaml")
    }

    let url = parseHeader(format, {
        ...variables,
        url: botList.api_url,
        token: botList.api_token
    })

    let data = {}
    let headers = {}

    let [authMod, authFormat, ...authExt] = botList.auth_format.split("#");

    if(authMod != "u" && authMod != "h" && authMod != "b") {
        throw new Error("Only u#, h#, and b# are supported for auth_format in bot_lists in config.yaml")
    }

    switch (authMod) {
        case "u": 
            if(url.includes("?")) {
                url += "&" + parseHeader(authFormat, variables)
            } else {
                url += "?" + parseHeader(authFormat, variables)
            }
            break;
        case "h":
            let [headerName, ...headerExt] = authFormat.split("/");
            headers = {
                ...headers,
                [headerName]: headerExt.join(",")
            }
            break;
        case "b":
            let [bodyName, ...bodyExt] = authFormat.split("=");
            data = {
                ...data,
                [bodyName]: parseHeader(bodyExt.join("="), variables)
            }
            break;
    }

    if(action.data_format) {
        for (const key in action.data_format) {
            let variable = variables[action.data_format[key]]
            
            if(variable) {
                data[key] = variable
            }
        }
    }

    return {
        url,
        data
    }
}

export async function postStats(client: AntiRaid, botList: BotList, action: BotListAction) {
    let variables = {
        servers: await getServerCount(client),
        shards: await getShardCount(client),
        members: await getServerCount(client)
    }

    let { url, data } = createData(botList, action, variables)

    client.logger.info("Posting stats", { url, data })

    let res = await fetch(url, {
        headers: {
            "Authorization": parseHeader(botList.auth_format, { token: botList.api_token })
        }
    })

    return res
}