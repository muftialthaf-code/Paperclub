import{Pool}from'pg';import{config}from'./config';import{maintain}from'./maintenance';
const pool=new Pool({connectionString:config().databaseUrl,max:1});
try{await maintain(pool);console.log('Expired venue access data and old aggregate event data cleaned.')}catch{console.error('Venue maintenance failed');process.exitCode=1}finally{await pool.end()}
