import {Game,CATEGORIES,ANSWERS,LIMIT} from './core.js';
import {Platform,friendlyError} from './platform.js';
import brain from '@phosphor-icons/core/assets/regular/brain.svg';
import arrow from '@phosphor-icons/core/assets/regular/arrow-right.svg';
import check from '@phosphor-icons/core/assets/regular/check.svg';
import cross from '@phosphor-icons/core/assets/regular/x.svg';
import undo from '@phosphor-icons/core/assets/regular/arrow-u-up-left.svg';
import sparkle from '@phosphor-icons/core/assets/regular/sparkle.svg';
import paw from '@phosphor-icons/core/assets/regular/paw-print.svg';
import cube from '@phosphor-icons/core/assets/regular/cube.svg';
import carrot from '@phosphor-icons/core/assets/regular/carrot.svg';
import mask from '@phosphor-icons/core/assets/regular/mask-happy.svg';
import question from '@phosphor-icons/core/assets/regular/question.svg';
import minus from '@phosphor-icons/core/assets/regular/minus.svg';
import trophy from '@phosphor-icons/core/assets/regular/trophy.svg';
const icons={brain,arrow,check,cross,undo,sparkle,paw,cube,carrot,mask,question,minus,trophy};
const icon=name=>`<span class="icon" aria-hidden="true">${icons[name]}</span>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.getElementById('app');const platform=new Platform();
let selected='anything',connected=false,connecting=true,connectionFailed=false,game;
let clueOpen=matchMedia('(min-width:760px)').matches;
const categoryIcons={anything:'sparkle',animals:'paw',objects:'cube',food:'carrot',characters:'mask'};
const answerIcons=['check','cross','minus','question'];
function face(mode='') {return `<div class="mind ${mode}" aria-hidden="true"><span class="eye"></span><span class="eye"></span><span class="smile"></span></div>`;}
function cluePanel(g) {
  return `<aside class="clue-panel"><details id="clues" ${clueOpen?'open':''}><summary><span>${icon('brain')} Your clues <span class="clue-count">${g.history.length}</span></span><span class="chevron">⌄</span></summary>
  ${g.history.length?`<ol class="clue-list">${g.history.map((t,i)=>`<li><span class="clue-number">${String(i+1).padStart(2,'0')}</span><div><p>${esc(t.question)}</p><span class="answer-tag ${t.answer==='Yes'?'positive':''}">${esc(t.answer)}</span></div></li>`).join('')}</ol>`:`<div class="clue-empty">${icon('sparkle')}<p>A little mystery<br>starts with you.</p><span>Your answers will collect here.<br>No typing your secret!</span></div>`}</details>
  <div class="how"><strong>The little rules</strong><p>Think of one specific thing.<br>Answer as honestly as you can.<br>AI gets 20 questions and one guess.</p><span>Not sure? “Don’t know” is a good answer.</span></div></aside>`;
}
function readyView() {
  return `${face()}<h1 id="main-heading" tabindex="-1">Got something in mind?</h1><p class="intro">Think of something. Keep it secret.<br>Let’s see if I can work it out.</p>
  <fieldset class="categories"><legend>Pick a category</legend><div class="category-options">${Object.entries(CATEGORIES).map(([key,label])=>`<button data-category="${key}" aria-pressed="${selected===key}" class="category ${selected===key?'selected':''}">${icon(categoryIcons[key])}${label}</button>`).join('')}</div></fieldset>
  <button class="primary start" id="start" ${connecting?'disabled':''}>${connecting?'Connecting…':"I’m ready"} ${icon('arrow')}</button><p class="quiet">20 questions. One final guess. Can you stump me?</p>
  ${connectionFailed?'<p class="connection-note" role="status">Anna could not connect. Press I’m ready to try again.</p>':''}`;
}
function gameView(g) {
  if(g.status==='won'||g.status==='stumped') {
    const won=g.status==='won';return `${face(won?'happy':'surprised')}<span class="eyebrow">${won?'MYSTERY SOLVED':'YOU STUMPED ME'}</span><h1 id="main-heading" tabindex="-1">${won?'Aha. I knew we’d get there.':'Well played, mystery keeper.'}</h1><p class="intro">${won?`It was <strong>${esc(g.current.guess)}</strong>.<br>Solved with ${g.history.length} clues.`:`My guess was <strong>${esc(g.current.guess)}</strong>.<br>Your secret stays yours.`}</p><button class="primary" id="replay">Play again ${icon('arrow')}</button><p class="quiet">A new secret. A fresh challenge.</p>`;
  }
  if(g.status==='confirm'&&!g.error) return `${face('curious')}<span class="eyebrow">MY ONE FINAL GUESS</span><h1 id="main-heading" tabindex="-1" class="guess-heading">Is it <span>${esc(g.current.guess)}</span>?</h1><p class="intro">${g.history.length} clues later… did I get it?</p><div class="confirm-actions"><button id="correct" class="primary">${icon('check')} Yes, you got it</button><button id="incorrect" class="secondary">${icon('cross')} Nope, I win</button></div><button id="undo" class="text-button">${icon('undo')} Change my last answer</button>`;
  const count=Math.min(g.history.length+1,LIMIT);
  return `<div class="question-top"><span class="category-label">${icon(categoryIcons[g.category])}${esc(CATEGORIES[g.category])}</span><span class="question-count">${g.pending&&g.history.length>=LIMIT?'Final guess':`Question ${count} of ${LIMIT}`}</span></div>
  ${face(g.pending?'thinking':'curious')}
  <div class="question-area" aria-live="polite" aria-atomic="true">${g.error?`<h1 id="main-heading" tabindex="-1">A small pause in the mystery.</h1><p class="error-copy" role="alert">${esc(friendlyError(g.error))}</p>`:g.pending?`<h1 id="main-heading" tabindex="-1">${g.history.length>=LIMIT?'Putting the clues together…':g.history.length?'Following your clues…':'Let’s start with a good question…'}</h1><p class="intro">${g.history.length?'Your secret is safe. I’m working on it.':'Think of one specific thing and keep it in mind.'}</p>`:`<h1 id="main-heading" tabindex="-1">${esc(g.current?.question)}</h1><p class="intro">Go with the answer that fits best.</p>`}</div>
  ${g.error?`<div class="error-actions">${g.attempts<3?'<button id="retry" class="primary">Try again</button>':'<p class="quiet">Three attempts could not complete this turn. Go back or start fresh.</p>'}<button id="new-error" class="secondary">Start fresh</button></div>`:`<div class="answers" aria-label="Answer the question">${ANSWERS.map((a,i)=>`<button class="answer answer-${i}" data-answer="${esc(a)}" ${g.pending?'disabled':''}>${icon(answerIcons[i])}<span>${esc(a)}</span></button>`).join('')}</div>`}
  <div class="under-answers">${g.history.length?`<button id="undo" class="text-button" ${g.pending?'disabled':''}>${icon('undo')} Undo last answer</button>`:'<span>Answer honestly. No trick questions.</span>'}<span>${g.pending?'<span class="loading-dot"></span> AI is thinking':'Take your time'}</span></div>`;
}
function render(g) {
  const oldDetails=document.getElementById('clues');if(oldDetails)clueOpen=oldDetails.open;
  const active=g.status!=='ready'||g.pending||g.error;
  root.innerHTML=`<div class="app-shell"><header class="app-header"><div class="brand"><span class="brand-mark">${icon('brain')}</span><span>MindReader</span></div><div class="header-actions">${active?'<button id="restart" class="text-button">New game</button>':'<span class="header-note">Your secret. My best guess.</span>'}</div></header>
  <main id="game"><div class="game-layout"><section class="game-card ${active?'active':'ready'}" aria-label="MindReader game">${active?gameView(g):readyView()}</section>${cluePanel(g)}</div></main>
  <footer><span>Just a guessing game. AI can be wrong.</span><span class="connection">${connected?'Powered by Anna AI':connecting?'Connecting to Anna…':'Open in Anna for AI'}</span></footer></div>`;
  document.getElementById('clues')?.addEventListener('toggle',e=>clueOpen=e.target.open);
  const list=root.querySelector('.clue-list');if(list)list.scrollTop=list.scrollHeight;
}
game=new Game((category,history)=>platform.ask(category,history));game.onChange=render;render(game);
root.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.category) {selected=button.dataset.category;render(game);root.querySelector(`[data-category="${selected}"]`)?.focus();return;}
  if(button.dataset.answer) {await game.answer(button.dataset.answer);if(!game.pending)document.getElementById('main-heading')?.focus();return;}
  switch(button.id) {
    case 'start':if(!connected){await connect();if(!connected){game.error=new Error('standalone');game.onChange(game);return;}}await game.start(selected);document.getElementById('main-heading')?.focus();break;
    case 'restart':case 'replay':case 'new-error':game.reset(selected);document.getElementById('start')?.focus();break;
    case 'retry':await game.retry();document.getElementById('main-heading')?.focus();break;
    case 'undo':game.undo();document.getElementById('main-heading')?.focus();break;
    case 'correct':game.confirm(true);document.getElementById('main-heading')?.focus();break;
    case 'incorrect':game.confirm(false);document.getElementById('main-heading')?.focus();break;
  }
});
async function connect() {
  if(connecting&&connectionStarted)return;
  connectionStarted=true;connecting=true;render(game);
  try {connected=await platform.connect();connectionFailed=false;}catch {connectionFailed=true;}
  finally {connecting=false;connectionStarted=false;render(game);}
}
let connectionStarted=false;connect();
