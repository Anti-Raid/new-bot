const { Client, ActivityType } = require("discord.js");

module.exports = {
    name: "ready",
    /**
     * 
     * @param {Client} client 
     */
    run: async (client) => {
        console.log("We are ready as " + client.user.username)
        client.user.setStatus("dnd")
        client.user.setActivity("Development of v6.0.0", {type: ActivityType.Watching})
    }
}