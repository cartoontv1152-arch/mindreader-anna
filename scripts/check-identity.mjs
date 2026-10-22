import {readFile} from 'node:fs/promises';
const app=JSON.parse(await readFile('app.json','utf8')),pkg=JSON.parse(await readFile('package.json','utf8'));
if(app.slug!=='mindreader-game'||app.name!=='MindReader'||app.version!==pkg.version)throw new Error('MindReader identity/version mismatch');
for(const file of ['.anna/app.json','.anna/dev-app.json']) {
  let cache;try{cache=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')continue;throw e;}
  if((cache.slug??cache.app_slug)!==app.slug||Number(cache.app_id??cache.appId)!==648||cache.host?.replace(/\/$/,'')!=='https://anna.partners')throw new Error(`${file} points at an unexpected app`);
}
console.log(`Identity checked: ${app.slug} / ${app.version}`);
