/*
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE team_member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    permissions TEXT[] NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMP NOT NULL DEFAULT NOW()
);
*/

import { Guild, PermissionsBitField } from "discord.js"
import sql from "../../db"

/**
 * The list of permissions
 */
export enum Permission {
    AuditLogs = "view_audit_log",
    KickMembers = "kick_members",
    BanMembers = "ban_members",
    TimeoutMembers = "timeout_members",
    Owner = "owner",
}

export class PermissionManager {
    private perms: Permission[] = []

    constructor(perms: Permission[]) {
        this.perms = perms
    }

    has(perm: Permission) {
        return this.perms.includes(perm) || this.perms.includes(Permission.Owner)
    }

    hasAll(perms: Permission[]) {
        return perms.every(p => this.has(p))
    }

    hasAny(perms: Permission[]) {
        return perms.some(p => this.has(p))
    }
}

/**
 * Gets the permissions of a user in a guild
 * @param guildId The guild id
 * @param userId The user id
 * @returns 
 */
export const getUserPermissions = async (guildId: string, userId: string): Promise<PermissionManager> => {
    let perms = await sql`
        SELECT permissions FROM team_member WHERE team_id = (SELECT team_owner FROM guilds WHERE id = ${guildId}) AND user_id = ${userId}
    `

    if(perms.length === 0) {
        return new PermissionManager([])
    }

    return new PermissionManager(perms[0].permissions)   
}

/**
 * Creates a guild along with a team with the name of the guild
 */
export const createGuildIfNotExists = async (guild: Guild) => {
    // Check if guild already exists
    let guildExists = await sql`SELECT COUNT(*) FROM guilds WHERE id = ${guild.id}`

    if(guildExists[0].count > 0) {
        return
    }

    await sql.begin(async sql => {
        let teamId = await sql`
        INSERT INTO teams (name) VALUES (${guild.name}) RETURNING id
    `
        await sql`
            INSERT INTO guilds (id, team_owner) VALUES (${guild.id}, ${teamId[0].id})
        `

        await sql`
            INSERT INTO team_member (team_id, user_id, permissions) VALUES (${teamId[0].id}, ${guild.ownerId}, ${[Permission.Owner]})
        `
    })
}

/**
 * Adds a member with specific permissions as a team member
 * @param guildId The guild id
 * @param userId The user id
 * @param perms The permissions to give the user
 */
export const setGuildMemberPermissions = async (guildId: string, userId: string, perms: Permission[]) => {
    let teamId = await getTeamId(guildId)

    if(!teamId) {
        throw new Error("Guild does not exist")
    }

    let count = await sql`SELECT COUNT(*) FROM team_member WHERE team_id = ${teamId} AND user_id = ${userId}`

    if(count[0].count > 0) {
        await sql`
            UPDATE team_member SET permissions = ${perms} WHERE team_id = ${teamId} AND user_id = ${userId}
        `
    } else {
        await sql`
            INSERT INTO team_member (team_id, user_id, permissions) VALUES (${teamId}, ${userId}, ${perms})
        `
    }
}

/**
 * Returns the team id of a guild
 * @param guildId The guild id
 */
export const getTeamId = async (guildId: string) => {
    let teamId = await sql`SELECT team_owner FROM guilds WHERE id = ${guildId}`

    if(teamId.length === 0) {
        return
    }

    return teamId[0].team_owner
}

/**
 * Syncs permissions of a guild by their role permissions
 */
export const syncGuildPermissionsByRole = async (guild: Guild) => {
    let members = await guild.members.fetch();

    let permMap: { [key: string]: Permission[] } = {}

    for(const [id, member] of members) {
        if(member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            permMap[id] = [Permission.AuditLogs, Permission.BanMembers, Permission.KickMembers, Permission.TimeoutMembers]
        }
    }

    permMap[guild.ownerId] = [Permission.Owner]

    for (const [id, perms] of Object.entries(permMap)) {
        await setGuildMemberPermissions(guild.id, id, perms)
    }

    return permMap
}