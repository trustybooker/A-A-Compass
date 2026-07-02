
const $ = id => document.getElementById(id);
const tierFeatures = {
  free: {name:'Free', price:'$0', voice:'Browser voice utility only', unlimited:false, saved:false, proVoice:false, cert:false},
  plus: {name:'Plus', price:'$19/mo', voice:'Saved listen mode + deeper plans', unlimited:true, saved:true, proVoice:false, cert:false},
  pro: {name:'Pro', price:'$99/mo', voice:'Premium A&A Aligned Voice Coach', unlimited:true, saved:true, proVoice:true, cert:true}
};
let currentPlan = localStorage.getItem('aa_plan') || 'free';
function normalize(text, fallback){ return (text||'').trim() || fallback; }
function scoreSession({state, desire, fear, gratitude}){
  let score = 45;
  if(['Grateful','Inspired','Ready','Hopeful'].includes(state)) score += 10;
  if(desire.length > 40) score += 10;
  if(fear.length > 10) score += 10;
  if(gratitude.length > 10) score += 15;
  return Math.min(100, Math.max(20, score));
}
function modeFromScore(s){ if(s<40)return 'Reset Mode'; if(s<55)return 'Clarity Mode'; if(s<70)return 'Alignment Mode'; if(s<85)return 'Act & Build Mode'; return 'Multiply & Serve Mode'; }
function deeperValue(area){
 const map={Money:'safety, freedom, stability, choice, and the ability to create without panic',Business:'useful value, visibility, trust, service, and consistent offers',Purpose:'meaning, direction, identity, contribution, and daily courage',Peace:'inner stability, space to think, and a nervous system that can act with clarity',Discipline:'self-trust, completion, rhythm, and proof that you can keep promises to yourself',Relationships:'love, understanding, communication, forgiveness, and safer connection',Creativity:'expression, originality, courage, and bringing invisible ideas into useful form',Service:'increase, contribution, generosity, and making life better for others'};
 return map[area]||'clarity, value, action, and growth';
}
function reading(){
 const state=$('state').value, area=$('area').value;
 const desire=normalize($('desire').value,'I want clarity, momentum, and a life that creates more value.');
 const fear=normalize($('fear').value,'waiting for perfect certainty before taking the next step');
 const gratitude=normalize($('gratitude').value,'life, awareness, the ability to choose again, and the next right action');
 const score=scoreSession({state,desire,fear,gratitude}); const mode=modeFromScore(score);
 return `Your A&A Compass Reading

Alignment mode: ${mode}
Score: ${score}/100
Area: ${area}
Current state: ${state}

Truth reflection:
You are not only asking for ${area.toLowerCase()}. You are asking for a clearer inner pattern and a stronger outer rhythm. The desire is real, but it needs direction, action, habit, gratitude, and service to become useful.

Deeper value:
Under this desire is ${deeperValue(area)}.

Misalignment to release:
Release the pattern of ${fear}. Name it, learn from it, but do not let it lead the next action.

Definite vision:
I am becoming a person who thinks deliberately, imagines clearly, acts consistently, gives thanks daily, and uses progress to increase life for myself and others.

One aligned action today:
Choose one specific step connected to this desire and complete it before the day ends. Make it small enough to finish and meaningful enough to build proof.

One habit loop:
For the next 7 days: 10 minutes of alignment, 20 minutes of focused action, 3 minutes of gratitude review.

Gratitude anchor:
I give thanks for ${gratitude}. I do not need the whole path to act faithfully today.

Service / increase-life action:
Help one person today with clarity, encouragement, a useful resource, a better offer, or a solved problem.

24-hour plan:
Morning: name the desire and read the gratitude anchor.
Midday: complete the aligned action.
Night: record what changed, what you learned, and what you will repeat tomorrow.

Original desire:
${desire}`;
}
function setPlan(plan){currentPlan=plan;localStorage.setItem('aa_plan',plan);const f=tierFeatures[plan];$('planNotice').textContent=`Prototype plan: ${f.name} (${f.price}). In production, Stripe controls this access on the server.`;$('voiceStatus').textContent=f.proVoice?'Pro preview enabled: premium aligned voice coach is available in production with realtime voice and pattern memory.':'Free/Plus use browser voice utilities here. Premium aligned voice coach is Pro only.';$('certStatus').textContent=f.cert?'Eligible to apply: Pro users can enter the certification pathway, but certification is not automatic.':'Locked: certification pathway requires Pro + application + assessment + supervised practice.'}
document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>setPlan(b.dataset.plan));
$('generate').onclick=()=>{const text=reading();$('result').textContent=text;$('result').classList.remove('hidden');$('resultActions').classList.remove('hidden');localStorage.setItem('aa_last_reading',text);};
$('copy').onclick=()=>navigator.clipboard.writeText($('result').textContent||'');
$('read').onclick=()=>{const text=$('result').textContent||'Generate a reading first.';const u=new SpeechSynthesisUtterance(text);u.rate=.92;u.pitch=1;u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u);};
$('speak').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('Speech recognition is not supported in this browser. You can still type your answer.');return}const r=new SR();r.lang='en-US';r.interimResults=false;r.onresult=e=>{$('desire').value=e.results[0][0].transcript};r.start();};
$('save').onclick=()=>{const text=$('result').textContent;if(!text){return}const list=JSON.parse(localStorage.getItem('aa_history')||'[]');list.unshift({date:new Date().toISOString(),plan:currentPlan,text});localStorage.setItem('aa_history',JSON.stringify(list.slice(0,20)));renderHistory();};
$('download').onclick=()=>{const blob=new Blob([$('result').textContent||''],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='aa-compass-reading.txt';a.click();};
$('voiceCoach').onclick=()=>{const f=tierFeatures[currentPlan];let msg=f.proVoice?`Premium voice coach preview\n\nI will listen for the desire beneath the words, ask smarter follow-up questions, and return a result with truth, action, habit, gratitude, and service. In production this uses realtime voice, pattern memory, and weekly reports.`:`This tier uses browser voice utilities only. To unlock the premium A&A Aligned Voice Coach, upgrade to Pro. You can still generate and listen to readings using browser read-aloud.`;$('voiceOutput').textContent=msg;$('voiceOutput').classList.remove('hidden');if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(msg);u.rate=.92;speechSynthesis.cancel();speechSynthesis.speak(u)}};
function renderHistory(){const list=JSON.parse(localStorage.getItem('aa_history')||'[]');$('historyList').innerHTML=list.length?list.map(x=>`<div class="historyItem"><b>${new Date(x.date).toLocaleString()} - ${x.plan}</b><p>${x.text.slice(0,280)}...</p></div>`).join(''):'<p class="notice">No saved sessions yet. Generate and save a Compass Reading.</p>';}
renderHistory();setPlan(currentPlan);
