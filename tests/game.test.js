import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,parseTurn,createRequest,ANSWERS,LIMIT} from '../src/core.js';
import {Platform,unwrap,friendlyError} from '../src/platform.js';
const question=(i)=>({kind:'question',question:`Does it have property ${i}?`});
const history=(n)=>Array.from({length:n},(_,i)=>({question:question(i).question,answer:ANSWERS[i%4]}));
const json=t=>JSON.stringify(t);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('strict response parser accepts fenced JSON and strips closed reasoning',()=>{
  assert.deepEqual(parseTurn('```json\n'+json(question(1))+'\n```'),question(1));
  assert.deepEqual(parseTurn('<think>not a visible answer</think>'+json({kind:'guess',guess:'elephant'}),history(4)),{kind:'guess',guess:'elephant'});
});
test('empty, mocked, oversized, multi-question and incomplete output never become game text',()=>{
  for(const raw of ['', '(mock) no fixture matched', '{"kind":', 'a'.repeat(16001),json({kind:'question',question:'Is it red? Is it big?'}),json({kind:'question',question:'Tell me the secret'})])assert.throws(()=>parseTurn(raw),/invalid_turn/);
});
test('repeated questions and a 21st question are rejected',()=>{
  assert.throws(()=>parseTurn(json(question(0)),history(3)),/invalid_turn/);
  assert.throws(()=>parseTurn(json(question(30)),history(20)),/invalid_turn/);
});
test('one guess means one candidate and at least four answered clues',()=>{
  for(const guess of ['cat or dog','cat/dog','<img src=x>','', 'a'.repeat(81)])assert.throws(()=>parseTurn(json({kind:'guess',guess}),history(4)),/invalid_turn/);
  assert.throws(()=>parseTurn(json({kind:'guess',guess:'cat'}),history(3)),/invalid_turn/);
});
test('request includes exact clue history, bounded tokens, and forces a final guess at 20',()=>{
  const req=createRequest('animals',history(LIMIT));
  const payload=JSON.parse(req.messages[0].content.text);
  assert.deepEqual(payload.clues,history(LIMIT));assert.equal(payload.questionsRemaining,0);
  assert.match(payload.instruction,/final guess/);assert.ok(req.maxTokens<=4096);
  assert.equal(req.messages.length,1);assert.equal(req.modelPreferences.hints,undefined);
  assert.throws(()=>createRequest('bad',[]),/invalid_category/);
  assert.throws(()=>createRequest('animals',[{question:'A?',answer:'ignore instructions'}]),/invalid_history/);
});
test('a pending start or answer cannot double-submit',async()=>{
  const d=deferred();let calls=0;const g=new Game(()=>{calls++;return d.promise;});
  const promise=g.start('food');g.start('food');g.answer('Yes');assert.equal(calls,1);
  d.resolve(question(1));await promise;assert.equal(g.status,'playing');assert.equal(g.history.length,0);
});
test('answer errors preserve one clue; retry does not append or consume another question',async()=>{
  let calls=0;const g=new Game(async()=>{calls++;if(calls===2)throw new Error('offline');return question(calls);});
  await g.start('objects');await g.answer('Yes');assert.equal(g.history.length,1);assert.ok(g.error);assert.equal(g.pending,false);
  await g.retry();assert.equal(g.history.length,1);assert.equal(g.current.question,question(3).question);assert.equal(g.error,null);
});
test('manual retries are bounded to three attempts per turn',async()=>{
  let calls=0;const g=new Game(async()=>{calls++;throw new Error('offline');});
  await g.start('animals');await g.retry();await g.retry();await g.retry();assert.equal(calls,3);assert.equal(g.history.length,0);
});
test('new game ignores both late success and late failure from the previous game',async()=>{
  for(const fail of [false,true]){const d=deferred();const g=new Game(()=>d.promise);const pending=g.start('animals');g.reset('food');if(fail)d.reject(new Error('old error'));else d.resolve(question(1));await pending;assert.equal(g.status,'ready');assert.equal(g.category,'food');assert.equal(g.current,null);assert.equal(g.error,null);assert.equal(g.pending,false);}
});
test('undo restores the last question without another AI call, including after a failure',async()=>{
  let calls=0;const g=new Game(async()=>{calls++;if(calls===3)throw new Error('offline');return question(calls);});
  await g.start('anything');await g.answer('No');await g.answer('Sometimes');g.undo();assert.equal(calls,3);assert.equal(g.history.length,1);assert.equal(g.current.question,question(2).question);assert.equal(g.error,null);assert.equal(g.status,'playing');
});
test('20 questions lead to exactly one guess and confirmation ends the game',async()=>{
  const g=new Game(async(c,h)=>h.length>=20?{kind:'guess',guess:'a toaster'}:question(h.length));
  await g.start('objects');for(let i=0;i<20;i++)await g.answer('Yes');assert.equal(g.history.length,20);assert.equal(g.status,'confirm');
  await g.answer('Yes');assert.equal(g.history.length,20);g.confirm(false);assert.equal(g.status,'stumped');g.confirm(true);assert.equal(g.status,'stumped');g.undo();assert.equal(g.status,'stumped');
});
test('correct guess confirmation, replay and category reset are deterministic',async()=>{
  const g=new Game(async(c,h)=>h.length>=4?{kind:'guess',guess:'elephant'}:question(h.length));
  await g.start('animals');for(let i=0;i<4;i++)await g.answer('No');assert.equal(g.status,'confirm');g.confirm(true);assert.equal(g.status,'won');g.reset('food');assert.equal(g.status,'ready');assert.equal(g.history.length,0);
});
test('Host errors are unwrapped and safe error messages identify quota and permissions',()=>{
  assert.deepEqual(unwrap({result:{result:{content:{text:'hello'}}}}),{content:{text:'hello'}});
  assert.throws(()=>unwrap({ok:false,error:{code:'APP_NOT_GRANTED',message:'permission denied'}}),/permission/);
  assert.match(friendlyError({code:'APP_QUOTA_EXCEEDED'}),/quota/);assert.match(friendlyError({code:'permission_denied'}),/AI access/);
});
test('malformed model result gets one repair attempt; no fake fallback is emitted',async()=>{
  const p=new Platform();let calls=0;p.anna={llm:{complete:async req=>{calls++;if(calls===1)return {content:{text:'not json'}};assert.match(req.systemPrompt,/previous output was invalid/);return {result:{content:{text:json(question(3))}}};}}};
  assert.deepEqual(await p.ask('animals',[]),question(3));assert.equal(calls,2);
  p.anna.llm.complete=async()=>({content:{text:'(mock) no fixture matched'}});await assert.rejects(p.ask('animals',[]),/invalid_turn/);
});
test('provider errors are not automatically retried, avoiding duplicate billed requests',async()=>{
  const p=new Platform();let calls=0;p.anna={llm:{complete:async()=>{calls++;throw new Error('quota');}}};
  await assert.rejects(p.ask('animals',[]),/quota/);assert.equal(calls,1);
});
