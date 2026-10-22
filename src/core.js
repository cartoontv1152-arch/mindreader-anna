export const LIMIT = 20;
export const CATEGORIES = {anything:'Anything',animals:'Animals',objects:'Objects',food:'Food',characters:'Characters'};
export const ANSWERS = ['Yes','No','Sometimes',"Don't know"];
const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g,'');

export function parseTurn(raw, history = []) {
  if (typeof raw !== 'string' || raw.length > 16000) throw new Error('invalid_turn');
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if(start < 0 || end < start) throw new Error('invalid_turn');
  let value; try { value=JSON.parse(text.slice(start,end+1)); } catch { throw new Error('invalid_turn'); }
  if(value?.kind==='question') {
    const question = typeof value.question==='string' ? value.question.trim() : '';
    if(!question || question.length>180 || (question.match(/\?/g)||[]).length!==1 || !question.endsWith('?')) throw new Error('invalid_turn');
    if(history.length>=LIMIT || history.some(t=>normalize(t.question)===normalize(question))) throw new Error('invalid_turn');
    return {kind:'question',question};
  }
  if(value?.kind==='guess') {
    const guess=typeof value.guess==='string'?value.guess.trim():'';
    if(!guess || guess.length>80 || /[\n\r{}<>?]/.test(guess) || /\sor\s|\//i.test(guess)) throw new Error('invalid_turn');
    // Give the game at least four real clues before its one final guess.
    if(history.length<4) throw new Error('invalid_turn');
    return {kind:'guess',guess};
  }
  throw new Error('invalid_turn');
}

export function createRequest(category, history, repair=false) {
  if(!Object.hasOwn(CATEGORIES,category)) throw new Error('invalid_category');
  if(history.length>LIMIT || history.some(t=>!ANSWERS.includes(t.answer))) throw new Error('invalid_history');
  return {
    systemPrompt: `/no_think\nYou are MindReader, playing twenty questions. The user privately thinks of one animal, everyday object, food, or fictional character. You do NOT know the secret. Infer it only from their answers. Category: ${CATEGORIES[category]}. Ask natural, concise, useful yes/no questions; use Sometimes and Don't know as uncertain clues. Ask about ONE property at a time. Never ask for the secret, its name, spelling, initials, or a free-text description. Never repeat an earlier question. Adapt to the full clue history, not a fixed script. Respect No answers and category constraints. Do not claim supernatural ability or certainty.\nReturn ONLY compact JSON: {"kind":"question","question":"one short yes/no question?","guess":null} OR {"kind":"guess","question":null,"guess":"one specific name"}. No markdown, reasoning, commentary, multiple guesses, or alternatives. Each string under 180 characters. You get one final guess; a wrong guess ends the game. Ask at least four questions first. Make a guess when clues are strong, usually by 10-15 answers. After 20 answered questions you MUST guess. ${repair?'The previous output was invalid. Follow the schema, count, and non-repetition rules exactly.':''}`,
    messages:[{role:'user',content:{type:'text',text:JSON.stringify({category:CATEGORIES[category],answeredQuestions:history.length,questionsRemaining:LIMIT-history.length,clues:history,instruction:history.length>=LIMIT?'Make your one final guess now.':'Choose your next question or your one final guess.'})}}],
    maxTokens:3072,temperature:0.35,
    modelPreferences:{speedPriority:0.8,costPriority:0.5,intelligencePriority:0.8}
  };
}

export class Game {
  constructor(ask,onChange=()=>{}) { this.ask=ask;this.onChange=onChange;this.epoch=0;this.reset(); }
  reset(category='anything') {
    this.epoch++;this.category=Object.hasOwn(CATEGORIES,category)?category:'anything';
    this.history=[];this.current=null;this.pending=false;this.error=null;this.status='ready';this.attempts=0;this.onChange(this);
  }
  start(category) { if(this.pending||this.status!=='ready')return;this.category=category;return this.next(); }
  async next() {
    if(this.pending || this.attempts>=3)return;
    const ticket=this.epoch;this.pending=true;this.error=null;this.attempts++;this.onChange(this);
    try {
      const turn=await this.ask(this.category,this.history.map(t=>({...t})));
      if(ticket!==this.epoch)return;
      this.current=turn;this.status=turn.kind==='guess'?'confirm':'playing';this.attempts=0;
    } catch(error) { if(ticket===this.epoch)this.error=error; }
    finally { if(ticket===this.epoch){this.pending=false;this.onChange(this);} }
  }
  answer(answer) {
    if(this.pending || this.error || this.status!=='playing' || !ANSWERS.includes(answer))return;
    this.history.push({question:this.current.question,answer});this.current=null;this.attempts=0;return this.next();
  }
  retry() { if(this.error&&!this.pending)return this.next(); }
  undo() {
    if(!this.history.length || this.pending || this.status==='won' || this.status==='stumped')return;
    this.epoch++;const last=this.history.pop();this.current={kind:'question',question:last.question};
    this.status='playing';this.error=null;this.attempts=0;this.onChange(this);
  }
  confirm(correct) {
    if(this.status!=='confirm'||this.pending)return;
    this.status=correct?'won':'stumped';this.onChange(this);
  }
}
