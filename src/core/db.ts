import postgres from 'postgres'

const sql = postgres({ 
    database: 'antiraid',
    transform: postgres.fromCamel
 })

export default sql