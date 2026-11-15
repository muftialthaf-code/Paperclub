import{emptyClub,validateClub}from'../src/shared/clubData';
export interface Statement{bind(...values:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;all<T=Record<string,unknown>>():Promise<{results:T[]}>;run():Promise<{meta:{changes:number}}>}
export interface Database{prepare(sql:string):Statement;batch(statements:Statement[]):Promise<{meta:{changes:number}}[]>}
export type Env={DB?:Database,authenticate?:(request:Request)=>Promise<Identity|null>,provider?:string};
export type Identity={id:string,email:string|null,displayName:string};
class HttpError extends Error{constructor(public status:number,public code:string){super(code)}}
const fail=(status:number,code:string):never=>{throw new HttpError(status,code)};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export function identity(request:Request):Identity|null{
 // These headers are authenticated and injected by Sites dispatch, never by a body/query parameter.
 const id=request.headers.get('oai-authenticated-user-id');if(!id||id.length>500)return null;
 const email=request.headers.get('oai-authenticated-user-email');let name=request.headers.get('oai-authenticated-user-full-name')||'';
 if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')try{name=decodeURIComponent(name)}catch{name=''}
 return{id,email,displayName:name.slice(0,80)||email?.split('@')[0]||'Parent'};
}
const name=(value:unknown)=>{if(typeof value!=='string')return fail(400,'invalid_name');const n=value.normalize('NFC').trim();if(!n||n.length>80||/[\u0000-\u001f\u007f]/.test(n))return fail(400,'invalid_name');return n};
async function payload(request:Request){if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return fail(415,'json_required');const reader=request.body?.getReader();if(!reader)return fail(400,'invalid_request');const chunks:Uint8Array[]=[];let size=0;for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();return fail(413,'data_too_large')}chunks.push(value)}const buffer=new Uint8Array(size);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length}try{const data=JSON.parse(new TextDecoder().decode(buffer));if(!data||typeof data!=='object'||Array.isArray(data))return fail(400,'invalid_request');return data as Record<string,unknown>}catch{return fail(400,'invalid_request')}}
async function member(db:Database,family:string,user:string){const row=await db.prepare('SELECT role FROM family_memberships WHERE family_id = ? AND user_id = ?').bind(family,user).first<{role:string}>();if(!row)return fail(404,'family_not_found');return row}
const integer=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
export async function api(request:Request,env:Env):Promise<Response>{try{
 const url=new URL(request.url),path=url.pathname;
 if(request.method==='OPTIONS')return response({error:'method_not_allowed'},405);
 if(path==='/api/status'&&request.method==='GET'){if(!env.DB)return response({accounts:'unavailable'},503);const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('parent_accounts', 'families', 'family_memberships', 'family_clubhouses')").all();return response({accounts:tables.results.length===4?'ready':'unavailable',provider:env.provider||'email-google'},tables.results.length===4?200:503)}
 const user=env.authenticate?await env.authenticate(request):null;
 if(path==='/api/account'&&request.method==='GET'&&!user)return response({user:null,account:null,families:[],provider:env.provider||'email-google'});
 if(!user)return fail(401,'sign_in_required');
 if(!['GET','HEAD'].includes(request.method)){
  if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return fail(403,'origin_rejected');
 }
 const db=env.DB;if(!db)return fail(503,'accounts_unavailable');
 if(path==='/api/account'&&request.method==='GET'){
  const account=await db.prepare('SELECT display_name AS displayName, created_at AS createdAt FROM parent_accounts WHERE id = ?').bind(user.id).first();
  const families=await db.prepare('SELECT f.id, f.name, f.created_at AS createdAt, m.role FROM families f JOIN family_memberships m ON m.family_id = f.id WHERE m.user_id = ? ORDER BY f.created_at, f.id').bind(user.id).all();
  return response({user,account,families:families.results,provider:env.provider||'email-google'});
 }
 if(path==='/api/account'&&request.method==='PATCH'){
  const p=await payload(request),displayName=name(p.displayName),now=new Date().toISOString();
  await db.prepare('INSERT INTO parent_accounts(id, display_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, email = excluded.email, updated_at = excluded.updated_at').bind(user.id,displayName,user.email,now,now).run();
  return response({displayName});
 }
 if(path==='/api/families'&&request.method==='POST'){
  const p=await payload(request),familyName=name(p.name),displayName=name(p.displayName||user.displayName),id=crypto.randomUUID(),now=new Date().toISOString();
  const result=await db.batch([
   db.prepare('INSERT INTO parent_accounts(id, display_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, email = excluded.email, updated_at = excluded.updated_at').bind(user.id,displayName,user.email,now,now),
   db.prepare('INSERT INTO families(id, name, owner_id, created_at, updated_at) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM families WHERE owner_id = ?) < 10').bind(id,familyName,user.id,now,now,user.id),
   db.prepare("INSERT INTO family_memberships(family_id, user_id, role, created_at) SELECT id, ?, 'owner', ? FROM families WHERE id = ?").bind(user.id,now,id),
   db.prepare('INSERT INTO family_clubhouses(family_id, data, revision, updated_at) SELECT id, ?, 0, ? FROM families WHERE id = ?').bind(JSON.stringify(emptyClub()),now,id)
  ]);if(!result[1].meta.changes)return fail(409,'family_limit');
  return response({family:{id,name:familyName,role:'owner',createdAt:now}},201);
 }
 const match=path.match(/^\/api\/families\/([a-zA-Z0-9_-]{1,128})(\/clubhouse)?$/);if(!match)return fail(404,'not_found');
 const id=match[1],membership=await member(db,id,user.id);
 if(!match[2]&&request.method==='PATCH'){
  if(membership.role!=='owner')return fail(403,'owner_required');const p=await payload(request),familyName=name(p.name);
  await db.prepare('UPDATE families SET name = ?, updated_at = ? WHERE id = ? AND owner_id = ?').bind(familyName,new Date().toISOString(),id,user.id).run();return response({name:familyName});
 }
 if(match[2]&&request.method==='GET'){
  const row=await db.prepare('SELECT data, revision, updated_at AS updatedAt FROM family_clubhouses WHERE family_id = ?').bind(id).first<{data:string,revision:number,updatedAt:string}>();if(!row)return fail(404,'family_not_found');
  return response({data:JSON.parse(row.data),revision:row.revision,updatedAt:row.updatedAt});
 }
 if(match[2]&&request.method==='PUT'){
  if(!['owner','editor'].includes(membership.role))return fail(403,'read_only');const p=await payload(request);if(!integer(p.revision))return fail(400,'invalid_revision');let data;try{data=validateClub(p.data)}catch{return fail(400,'invalid_clubhouse')}
  const now=new Date().toISOString();const result=await db.prepare("UPDATE family_clubhouses SET data = ?, revision = revision + 1, updated_at = ? WHERE family_id = ? AND revision = ? AND EXISTS (SELECT 1 FROM family_memberships WHERE family_id = ? AND user_id = ? AND role IN ('owner', 'editor'))").bind(JSON.stringify(data),now,id,p.revision,id,user.id).run();
  if(!result.meta.changes)return fail(409,'revision_conflict');return response({revision:(p.revision as number)+1,updatedAt:now});
 }
 return fail(405,'method_not_allowed');
 }catch(error){if(error instanceof HttpError)return response({error:error.code},error.status);console.error('Account API failed',error instanceof Error?error.name:'Unknown error');return response({error:'accounts_unavailable'},503)}}
