import {createRequest,parseTurn} from './core.js';
export function unwrap(value) {
  for(let i=0;i<4;i++) {
    if(value?.ok===false || value?.success===false) {const e=new Error(value.error?.message||String(value.error||'Anna request failed'));e.code=value.error?.code;throw e;}
    if(value && typeof value==='object' && 'result' in value)value=value.result;else return value;
  }return value;
}
export function friendlyError(error) {
  const text=`${error?.code||''} ${error?.message||error||''}`;
  if(/standalone/i.test(text))return 'Open MindReader in Anna to play with AI.';
  if(/quota|credit|balance/i.test(text))return 'Your Anna AI quota is used up. Your clues are still here. Check your quota in Anna, then retry.';
  if(/grant|permission|denied/i.test(text))return 'MindReader needs AI access. Check its permissions in Anna, then retry.';
  if(/invalid_turn|maxTokens/i.test(text))return 'AI did not return a usable question. Your clues are safe. Try again.';
  if(/timeout|timed out/i.test(text))return 'AI took too long. Your clues are safe. Retry when you are ready.';
  return 'AI could not answer right now. Your clues are safe. Try again.';
}
export class Platform {
  constructor(){this.anna=null;}
  async connect() {
    if(this.anna)return true;
    if(window.parent===window&&!new URLSearchParams(location.search).has('wid'))return false;
    const {AnnaAppRuntime}=await import('/static/anna-apps/_sdk/latest/index.js');
    let timer;try {this.anna=await Promise.race([AnnaAppRuntime.connect(),new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('Anna connection timed out')),18000))]);}finally{clearTimeout(timer);}
    await Promise.all([this.anna.window.set_title({title:'MindReader'},{timeoutMs:12000}),this.anna.window.ready({},{timeoutMs:12000})]);return true;
  }
  async ask(category,history) {
    if(!this.anna)throw new Error('standalone');
    for(let i=0;i<2;i++) {
      const response=unwrap(await this.anna.llm.complete(createRequest(category,history,i===1),{timeoutMs:50000}));
      try {
        if(response?.stopReason==='maxTokens')throw new Error('invalid_turn');
        return parseTurn(response?.content?.text||response?.text||'',history);
      } catch(error) { if(i===1)throw error; }
    }
  }
}
