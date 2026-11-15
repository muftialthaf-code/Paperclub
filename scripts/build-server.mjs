import{build}from'esbuild';import{readdir,readFile,mkdir,writeFile,cp}from'node:fs/promises';import path from'node:path';
const assets={};async function collect(dir){for(const file of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,file.name);if(file.isDirectory()){if(!['server','.openai'].includes(file.name))await collect(name)}else assets['/'+path.relative('dist',name).split(path.sep).join('/')]=(await readFile(name)).toString('base64')}}await collect('dist');
await mkdir('dist/server',{recursive:true});await build({entryPoints:['server/index.ts'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,plugins:[{name:'embedded-client',setup(b){b.onResolve({filter:/^paperclub:assets$/},()=>({path:'assets',namespace:'embedded'}));b.onLoad({filter:/.*/,namespace:'embedded'},()=>({contents:'export const assets='+JSON.stringify(assets),loader:'js'}))}}]});
await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');
// Sites provisions the logical D1 binding; migrations are shipped alongside the Worker.
await cp('drizzle','dist/server/drizzle',{recursive:true});
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'paperclub',main:'index.js',compatibility_date:'2026-01-01',compatibility_flags:['nodejs_compat'],d1_databases:[{binding:'DB',database_name:'paperclub',database_id:'local',migrations_dir:'drizzle'}]},null,2));
console.log('Built server Worker with '+Object.keys(assets).length+' bundled public assets.');
