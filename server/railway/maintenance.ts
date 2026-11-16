import{Pool}from'pg';import{fileURLToPath}from'node:url';import path from'node:path';import{config}from'./config';
/** Remove only short-lived access/analytics data; never deletes customers, families, businesses or published content. */
export async function maintain(pool:Pool){const db=await pool.connect();try{await db.query('BEGIN');await db.query("SELECT pg_advisory_xact_lock(14316558)");for(const sql of[
 "DELETE FROM venue_rate_limits WHERE window_at<NOW()-INTERVAL '1 day'",
 'DELETE FROM business_admin_stepup WHERE expires_at<NOW()',
 "DELETE FROM business_invitations WHERE expires_at<NOW()-INTERVAL '30 days' AND accepted_at IS NULL",
 "DELETE FROM venue_game_runs WHERE started_at<NOW()-INTERVAL '90 days'",
 "DELETE FROM venue_guest_sessions s WHERE expires_at<NOW()-INTERVAL '90 days' AND NOT EXISTS (SELECT 1 FROM venue_game_runs r WHERE r.session_id=s.id)",
 "DELETE FROM venue_daily_codes c WHERE expires_at<NOW()-INTERVAL '90 days' AND NOT EXISTS (SELECT 1 FROM venue_guest_sessions s WHERE s.code_id=c.id)",
 "DELETE FROM venue_page_visits WHERE day<CURRENT_DATE-90",
 "DELETE FROM venue_failed_entries WHERE day<CURRENT_DATE-90",
 "DELETE FROM venue_assets a WHERE created_at<NOW()-INTERVAL '30 days' AND NOT EXISTS (SELECT 1 FROM venue_locations l WHERE l.draft->>'logoId'=a.id OR l.published->>'logoId'=a.id)"
])await db.query(sql);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}}
async function main(){const pool=new Pool({connectionString:config().databaseUrl,max:1});try{await maintain(pool);console.log('Expired venue access data and old aggregate event data cleaned.')}finally{await pool.end()}}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Venue maintenance failed');process.exitCode=1});
