import postgres from 'postgres'

const sql = postgres({ 
    database: 'antiraid',
 })

export default sql