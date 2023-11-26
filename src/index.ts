/**
 * Sharding implementation for the bot
 */
import { ShardingManager } from "discord.js"
import { config } from "./config";
import { Logger } from "./logger";

let logger = new Logger()

const manager = new ShardingManager("./build/setup.js", { token: config.token });

manager.on("shardCreate", (shard) => {
    logger.info("ShardManager", `Launched shard ${shard.id} [${shard.id + 1}/${manager.totalShards}]`)
});

manager.spawn();