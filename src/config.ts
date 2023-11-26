import { parse } from 'yaml'
import { readFileSync } from "node:fs"

interface Config {
    client_id: string,
    token: string,
}

const loadConfig = (): Config => {
    let parsed = parse(readFileSync("./config.yaml").toString('utf-8'))

    if(!parsed.client_id) throw new Error("client_id is required in config.yaml")
    if(!parsed.token) throw new Error("token is required in config.yaml")

    return {
        client_id: parsed.client_id,
        token: parsed.token
    }
}

export const config: Config = loadConfig();