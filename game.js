import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const arenaEl = $('#arena');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#111827');
scene.fog = new THREE.FogExp2('#111827', 0.022);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 180);
camera.position.set(0, 9.5, 17.5);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
arenaEl.prepend(renderer.domElement);

const hemi = new THREE.HemisphereLight('#d9efff', '#34364b', 2.1);
scene.add(hemi);
const keyLight = new THREE.DirectionalLight('#fff1d2', 3.2);
keyLight.position.set(-5, 12, 7); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -14; keyLight.shadow.camera.right = 14; keyLight.shadow.camera.top = 14; keyLight.shadow.camera.bottom = -14;
scene.add(keyLight);
const cyanLight = new THREE.PointLight('#67d9e8', 28, 22); cyanLight.position.set(7, 4, -4); scene.add(cyanLight);
const pinkLight = new THREE.PointLight('#ba8dff', 16, 20); pinkLight.position.set(-7, 4, -5); scene.add(pinkLight);

const mats = {
 floor: new THREE.MeshStandardMaterial({ color: '#202a3d', roughness: .88, metalness: .16 }),
 edge: new THREE.MeshStandardMaterial({ color: '#36445e', roughness: .45, metalness: .45 }),
 lime: new THREE.MeshStandardMaterial({ color: '#c8f36b', roughness: .4, emissive: '#314b14', emissiveIntensity: .35 }),
 cyan: new THREE.MeshStandardMaterial({ color: '#72deeb', roughness: .38, metalness: .16, emissive: '#10515a', emissiveIntensity: .38 }),
 violet: new THREE.MeshStandardMaterial({ color: '#a78bfa', roughness: .5, emissive: '#3c2868', emissiveIntensity: .3 }),
 coral: new THREE.MeshStandardMaterial({ color: '#ff829c', roughness: .48, emissive: '#572033', emissiveIntensity: .25 }),
 dark: new THREE.MeshStandardMaterial({ color: '#161d2d', roughness: .66, metalness: .24 }),
};
const ground = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, .65, 64), mats.floor);
ground.position.y = -.38; ground.receiveShadow = true; scene.add(ground);
const rim = new THREE.Mesh(new THREE.TorusGeometry(10.85, .17, 8, 80), mats.edge); rim.rotation.x = Math.PI / 2; rim.position.y = -.02; scene.add(rim);
const grid = new THREE.GridHelper(21, 28, '#485872', '#344157'); grid.position.y = -.045; grid.material.transparent = true; grid.material.opacity = .42; scene.add(grid);
for (let i=0;i<24;i++) { const a=i/24*Math.PI*2; const p=new THREE.Mesh(new THREE.BoxGeometry(.14,.28,.14), i%3===0?mats.cyan:mats.edge); p.position.set(Math.cos(a)*10.78,.08,Math.sin(a)*10.78); p.rotation.y=-a; scene.add(p); }
const setPieces = new THREE.Group(); scene.add(setPieces);
const objects = [];
const actors = [];
const actorDefs = [
 {id:'you',name:'You',color:'#c8f36b',x:-2,z:1,local:true},
 {id:'nova',name:'Nova',color:'#a78bfa',x:2,z:-1},
 {id:'pixel',name:'Pixel',color:'#ff829c',x:-4,z:-3},
 {id:'echo',name:'Echo',color:'#72deeb',x:4,z:3},
];
function makeActor(def) {
 const group=new THREE.Group();
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:'#050711',transparent:true,opacity:.36})); shadow.rotation.x=-Math.PI/2; shadow.position.y=.018; group.add(shadow);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.64,4,10),new THREE.MeshStandardMaterial({color:def.color,roughness:.43,metalness:.1})); body.position.y=.72; body.castShadow=true; group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.24,16,12),new THREE.MeshStandardMaterial({color:'#e4e6ed',roughness:.58})); head.position.y=1.36; head.castShadow=true; group.add(head);
 const visor=new THREE.Mesh(new THREE.BoxGeometry(.28,.075,.09),new THREE.MeshStandardMaterial({color:def.color,emissive:def.color,emissiveIntensity:.6,roughness:.28})); visor.position.set(0,1.39,.205); group.add(visor);
 const pack=new THREE.Mesh(new THREE.BoxGeometry(.34,.38,.16),mats.dark); pack.position.set(0,.82,-.27); pack.castShadow=true; group.add(pack);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.44,.035,6,24),new THREE.MeshBasicMaterial({color:def.color,transparent:true,opacity:.78})); ring.rotation.x=Math.PI/2; ring.position.y=.07; group.add(ring);
 group.position.set(def.x,0,def.z); scene.add(group);
 const actor={...def,group,body,head,ring,health:100,alive:true,vy:0,bob:Math.random()*5,score:0}; actors.push(actor); return actor;
}
actorDefs.forEach(makeActor);
const actorById=Object.fromEntries(actors.map(a=>[a.id,a]));
const starMat=new THREE.PointsMaterial({color:'#aab9d4',size:.045,transparent:true,opacity:.68});
const starGeo=new THREE.BufferGeometry();const starPos=[];for(let i=0;i<230;i++){starPos.push((Math.random()-.5)*95,Math.random()*35-3,-20-Math.random()*55)}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));scene.add(new THREE.Points(starGeo,starMat));
const beams=new THREE.Group();scene.add(beams);
function addBeam(x,z,color){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,1.3,7,24,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(x,3.55,z);beams.add(beam);return beam;}
addBeam(-7,-5,'#72deeb');addBeam(7,-3,'#b49aff');

const modeLabels={survival:'SURVIVAL',sandbox:'SANDBOX',sabotage:'SABOTAGE'};
const state={mode:'survival',round:1,phase:'prompt',phaseTime:10,turn:'you',used:new Set(),elapsed:0,gameOver:false,gravity:1,water:0,worldScale:1,combo:0,sfx:true,secretGoal:'tower',goalProgress:0,toastTimeout:null,turnOrder:['you','nova','pixel','echo'],turnIndex:0,lastDamage:0,openingPrompt:true};
const keys={};
let lastFrame=performance.now();
const clock=new THREE.Clock();

function resize(){const w=arenaEl.clientWidth,h=arenaEl.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(arenaEl);resize();

function updatePlayers(){
 $('#players-list').innerHTML=actors.map(a=>`<div class="player-row ${a.id==='you'?'you':a.id} ${state.turn===a.id?'active':''} ${!a.alive?'eliminated':''}"><span class="player-avatar">${a.name[0]}</span><span class="player-name">${a.name}</span><span class="player-state">${!a.alive?'OUT':state.turn===a.id?'TURN':`${Math.ceil(a.health)}%`}</span></div>`).join('');
 $('#turn-name').textContent=actorById[state.turn]?.name||'—';$('#turn-avatar').textContent=actorById[state.turn]?.name[0]||'✦';
 $('#round-number').textContent=String(state.round).padStart(2,'0');$('#round-mode-short').textContent=modeLabels[state.mode];
}
function addEvent(who,text,icon='✦',reference=null){
 const feed=$('#event-feed');const now=new Date();const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 const credit=reference?`<span class="reference-credit">Inspired by <a href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(reference.title)}</a></span>`:'';
 const item=document.createElement('div');item.className='feed-event';item.innerHTML=`<span class="feed-glyph">${icon}</span><div><strong>${who}</strong> ${text}${credit}<time>${time} · JUST NOW</time></div>`;feed.prepend(item);while(feed.children.length>5)feed.lastChild.remove();
}
function toast(text){$('#toast-message').textContent=text;const el=$('#arena-toast');el.classList.add('show');clearTimeout(state.toastTimeout);state.toastTimeout=setTimeout(()=>el.classList.remove('show'),2300);}
function updateObjectCount(){const count=objects.filter(o=>o.parent).length+1;$('#object-count').textContent=`${String(count).padStart(2,'0')} OBJECTS`;$('#word-count').textContent=`${state.used.size} WORD${state.used.size===1?'':'S'} USED`;}
function setTurn(id){state.turn=id;updatePlayers();const user=id==='you';$('#word-input').disabled=!user;$('#manifest-button').disabled=!user;$('#console-eyebrow').textContent=user?'YOUR WORD, YOUR WORLD':`${actorById[id]?.name.toUpperCase()||'REALITY'} IS CREATING`;
 $('#console-hint').textContent=user?'One word. Make it count.':`Watch what ${actorById[id]?.name||'they'} bring into reality.`;$('#timer-caption').textContent='CREATION WINDOW';$('#arena-help').textContent=user?'YOUR TURN · TYPE A WORD':'CREATION IN PROGRESS';if(user){$('#word-input').focus({preventScroll:true});} }
function startCountdown(){state.phase='countdown';state.phaseTime=12;state.turn=null;$('#word-input').disabled=true;$('#manifest-button').disabled=true;$('#console-eyebrow').textContent='YOUR WORD, YOUR WORLD';$('#console-hint').textContent='A new creation prompt is coming.';$('#timer-caption').textContent='UNTIL NEXT CREATION';$('#arena-help').textContent='WASD TO MOVE · SPACE TO JUMP';$('#turn-name').textContent='—';$('#turn-avatar').textContent='✦';updatePlayers();}
function showObjective(){const cfg={survival:['YOUR OBJECTIVE','♢','Stay alive. The arena gets more dangerous every round.'],sandbox:['OPEN CREATION','⌘','Make something strange. The world is yours to shape.'],sabotage:['SECRET OBJECTIVE','◎',`Reach the ${state.secretGoal}. Can you bend reality your way?`]};$('#objective-heading').textContent=cfg[state.mode][0];$('#goal-icon').textContent=cfg[state.mode][1];$('#goal-text').textContent=cfg[state.mode][2];}
function switchMode(mode){state.mode=mode;document.querySelectorAll('.mode-option').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));actors.forEach(a=>{a.alive=true;a.health=100;});$('#modal').classList.add('hidden');state.gameOver=false;showObjective();updatePlayers();restartRound(false);addEvent('Reality',`shifted to <strong>${modeLabels[mode].toLowerCase()}</strong> mode.`,'↻');}
function restartRound(clearWorld=true){state.round=1;state.elapsed=0;state.phase='prompt';state.phaseTime=10;state.turn='you';state.turnIndex=0;state.openingPrompt=true;state.used.clear();state.gameOver=false;state.gravity=1;state.water=0;state.goalProgress=0;scene.fog.color.set('#111827');$('#goal-progress').style.width='0%';$('#goal-progress-label').textContent='0 / 1';$('#modal').classList.add('hidden');actors.forEach((a,i)=>{a.alive=true;a.health=100;a.group.visible=true;a.group.position.set(actorDefs[i].x,0,actorDefs[i].z);a.vy=0;});if(clearWorld){for(const o of [...objects]){scene.remove(o);const i=objects.indexOf(o);if(i>=0)objects.splice(i,1);}setPieces.clear();}updateObjectCount();$('#timer-caption').textContent='CREATION WINDOW';$('#console-eyebrow').textContent='YOUR WORD, YOUR WORLD';$('#console-hint').textContent='One word. Make it count.';$('#word-input').disabled=false;$('#manifest-button').disabled=false;$('#word-input').value='';showObjective();updatePlayers();toast('Your first creation is ready.');}

function createMesh(geo,material,x,y,z,scale=1){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.setScalar(scale);m.castShadow=true;m.receiveShadow=true;setPieces.add(m);objects.push(m);return m;}
function createPokeBall(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.word='pokemon ball';
 const red=new THREE.MeshStandardMaterial({color:'#f04452',roughness:.27,metalness:.12});
 const white=new THREE.MeshStandardMaterial({color:'#f2f4f8',roughness:.3,metalness:.08});
 const black=new THREE.MeshStandardMaterial({color:'#171b27',roughness:.3,metalness:.18});
 const button=new THREE.MeshStandardMaterial({color:'#f8fbff',roughness:.2,metalness:.12,emissive:'#71809a',emissiveIntensity:.12});
 const upper=new THREE.Mesh(new THREE.SphereGeometry(.86,36,24,0,Math.PI*2,0,Math.PI/2),red);
 const lower=new THREE.Mesh(new THREE.SphereGeometry(.86,36,24,0,Math.PI*2,Math.PI/2,Math.PI/2),white);
 upper.position.y=.87;lower.position.y=.87;upper.castShadow=lower.castShadow=true;upper.receiveShadow=lower.receiveShadow=true;group.add(upper,lower);
 const belt=new THREE.Mesh(new THREE.TorusGeometry(.835,.09,12,48),black);belt.rotation.x=Math.PI/2;belt.position.y=.87;belt.castShadow=true;group.add(belt);
 const buttonFrame=new THREE.Mesh(new THREE.CylinderGeometry(.255,.255,.16,32),black);buttonFrame.rotation.x=Math.PI/2;buttonFrame.position.set(0,.87,.84);buttonFrame.castShadow=true;group.add(buttonFrame);
 const buttonFace=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.17,32),button);buttonFace.rotation.x=Math.PI/2;buttonFace.position.set(0,.87,.88);group.add(buttonFace);
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),new THREE.MeshBasicMaterial({color:'#fff'}));glint.position.set(-.045,.925,.973);group.add(glint);
 setPieces.add(group);objects.push(group);return group;
}
function visualLabel(word){
 const value=word.toLowerCase().trim();
 if(/pok[eé]?mon(?:\s*ball)?|pok[eé]?ball|monster\s*ball/.test(value))return 'Poké Ball';
 if(/\b(cat|kitten|dog|puppy|fox|wolf|dragon|bird|shark|fish|whale|duck)\b/.test(value))return 'creature';
 if(/\b(ball|orb|sphere|planet|moon)\b/.test(value))return 'round object';
 if(/\b(sword|knife|spear|wand)\b/.test(value))return 'held object';
 if(/\b(tree|flower|mushroom|forest)\b/.test(value))return 'plant';
 return '3D word sculpture';
}
function spawnWord(word,actor,fromBot=false,reference=null){const normalized=word.toLowerCase().trim();if(!normalized)return false;if(state.used.has(normalized)){toast('That word has already been used.');return false;}state.used.add(normalized);state.combo++;const x=THREE.MathUtils.clamp(actor.group.position.x+(Math.random()-.5)*5,-7.3,7.3),z=THREE.MathUtils.clamp(actor.group.position.z-2-Math.random()*3,-7.5,7.5);let effect='';let material=mats.cyan;let geo=new THREE.IcosahedronGeometry(.8,1);let y=.85;let harmful=false;const appearance=visualLabel(normalized);let customObject=null;
 if(appearance==='Poké Ball'){customObject=createPokeBall(x,z);effect='a Poké Ball takes shape';}
 else if(/zero.?gravity|float|gravity|weightless/.test(normalized)){state.gravity=state.gravity===0?1:0;effect=state.gravity===0?'gravity vanished':'gravity returned';scene.fog.color.set(state.gravity===0?'#18243f':'#111827');}
 else if(/flood|water|ocean|tide|rain/.test(normalized)){state.water=Math.min(2.4,state.water+1.15);effect='water is rising';material=new THREE.MeshStandardMaterial({color:'#42c9e8',transparent:true,opacity:.72,roughness:.18,metalness:.2,emissive:'#0b526a',emissiveIntensity:.5});const sea=createMesh(new THREE.BoxGeometry(20,.12,20),material,0,state.water-1.6,0);sea.userData.water=true;}
 else if(/lava|fire|volcano|inferno|flame/.test(normalized)){material=new THREE.MeshStandardMaterial({color:'#ff673f',roughness:.35,emissive:'#d62b10',emissiveIntensity:1.5});geo=new THREE.ConeGeometry(1.05,1.6,7);y=.78;effect='a hazard scorches the floor';harmful=true;}
 else if(/giant|enlarge|big|huge|grow/.test(normalized)){const nearest=[...objects].sort((a,b)=>a.position.distanceTo(actor.group.position)-b.position.distanceTo(actor.group.position))[0];if(nearest){nearest.scale.multiplyScalar(1.65);effect='the nearest thing grew';}else effect='reality stretches';}
 else if(/shrink|tiny|small/.test(normalized)){const nearest=[...objects].sort((a,b)=>a.position.distanceTo(actor.group.position)-b.position.distanceTo(actor.group.position))[0];if(nearest){nearest.scale.multiplyScalar(.58);effect='the nearest thing shrank';}else effect='everything feels smaller';}
 else if(/trampoline|bounce|spring|pillow/.test(normalized)){geo=new THREE.CylinderGeometry(1.2,1.2,.22,32);material=new THREE.MeshStandardMaterial({color:'#c48aff',roughness:.35,metalness:.2,emissive:'#542c78',emissiveIntensity:.45});y=.1;effect='a bouncy pad appears';actors.forEach(a=>a.vy=9);}
 else if(/castle|tower|wall|fortress|shelter/.test(normalized)){geo=new THREE.BoxGeometry(2.1,2.4,1.5);material=mats.edge;y=1.2;effect='a shelter rises from the floor';}
 else if(/moon|planet|sun|star|orb/.test(normalized)){geo=new THREE.SphereGeometry(.92,24,18);material=new THREE.MeshStandardMaterial({color:'#d7d2c8',roughness:.8,emissive:'#88744a',emissiveIntensity:.2});y=3;effect='a small celestial body appears';}
 else if(/shark|fish|bird|dragon|whale|duck|rubber/.test(normalized)){geo=new THREE.ConeGeometry(.64,1.5,5);material=/shark|dragon/.test(normalized)?mats.coral:mats.cyan;y=2.2;effect=`a ${normalized} takes flight`;}
 else if(/ice|crystal|diamond|glass/.test(normalized)){geo=new THREE.OctahedronGeometry(.95,0);material=new THREE.MeshPhysicalMaterial({color:'#a4efff',roughness:.12,metalness:.3,transmission:.22,emissive:'#15536a',emissiveIntensity:.3});y=1.05;effect='a crystal structure refracts the light';}
 else if(/glitch|memory|nostalgia|dream|echo|silence|chaos|time|music/.test(normalized)){geo=new THREE.TorusKnotGeometry(.62,.19,80,12);material=new THREE.MeshStandardMaterial({color:'#d798ff',metalness:.35,roughness:.3,emissive:'#6f35ad',emissiveIntensity:.65});y=1.25;effect='reality bends around an abstract idea';}
 else if(/bomb|meteor|spike|trap|shard|knife/.test(normalized)){geo=new THREE.DodecahedronGeometry(.8,0);material=mats.coral;y=.85;effect='a dangerous object materializes';harmful=true;}
 else if(/bridge|road|path|stair|stairs/.test(normalized)){geo=new THREE.BoxGeometry(3,.22,.85);material=mats.lime;y=.18;effect='a path connects the impossible';}
 else if(/tree|flower|forest|mushroom/.test(normalized)){geo=new THREE.ConeGeometry(.72,1.8,7);material=new THREE.MeshStandardMaterial({color:'#a5d875',roughness:.7,emissive:'#284822',emissiveIntensity:.4});y=1;effect='something living takes root';}
 else {const tier=normalized.length>8||/ness|ity|ism|ance|ment/.test(normalized)?'abstract':normalized.length>5?'rare':'common';if(tier==='abstract'){geo=new THREE.TorusKnotGeometry(.68,.16,72,10);material=mats.violet;y=1.35;effect='an abstract idea warps the arena';}else if(tier==='rare'){geo=new THREE.DodecahedronGeometry(.9,1);material=mats.coral;effect='a curious artifact appears';}else{geo=new THREE.BoxGeometry(1.45,1.45,1.45);material=mats.cyan;effect='a new object joins the world';}}
 if(!customObject&&!/flood|water|ocean|tide|rain|giant|enlarge|big|huge|grow|shrink|tiny|small|zero.?gravity|float|gravity|weightless/.test(normalized)){const mesh=createMesh(geo,material,x,y,z);mesh.userData={word:normalized,harmful};}
 const who=fromBot?actor.name:'You';addEvent(who,`manifested <strong>${escapeHtml(normalized)}</strong> — ${effect}.`,harmful?'⚠':'✦',reference);toast(`${normalized} — ${effect}.`);updateObjectCount();
 if(state.mode==='sabotage'&&!fromBot){const goal=state.secretGoal;if(normalized.includes(goal)||/tower|stairs|bridge/.test(normalized)){state.goalProgress=1;$('#goal-progress').style.width='100%';$('#goal-progress-label').textContent='1 / 1';setTimeout(()=>finishGame(true,'You found a way to your secret goal.'),900);}}
 if(state.mode==='survival'&&harmful){const targets=actors.filter(a=>a.alive);const victim=targets.sort((a,b)=>a.group.position.distanceTo(new THREE.Vector3(x,0,z))-b.group.position.distanceTo(new THREE.Vector3(x,0,z)))[0];if(victim&&victim.group.position.distanceTo(new THREE.Vector3(x,0,z))<3){damage(victim,26);}}
 return true;
}
function escapeHtml(text){return text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function damage(actor,amount){if(!actor.alive||state.mode!=='survival')return;actor.health=Math.max(0,actor.health-amount);updatePlayers();if(actor.health===0){actor.alive=false;addEvent('Arena',`${actor.name} was eliminated.`,'×');actor.group.visible=false;const alive=actors.filter(a=>a.alive);if(alive.length<=1)finishGame(alive[0]?.id==='you',alive[0]?.id==='you'?'You are the last one standing.':'The arena claimed the final survivor.');}}

const botWords=['Trampoline','Moon','Crystal','Bridge','Glitch','Shark','Castle','Zero Gravity','Flower','Lava','Rubber Duck','Giant','Pillow','Meteor','Dream'];
const botReferences=[];
let referenceRequestPending=false;
function setReferenceStatus(label,title){const status=$('#connection-status');status.textContent=label;status.title=title;}
async function fetchBotReference(){
 if(referenceRequestPending)return;
 referenceRequestPending=true;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary',{headers:{Accept:'application/json'},signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error(`Wikipedia returned ${response.status}`);
  const summary=await response.json();
  const title=String(summary?.title||'').replace(/<[^>]*>/g,'').trim();
  const word=title.replace(/[^a-zA-Z -]/g,'').replace(/\s+/g,' ').replace(/\s*[-–—]\s*/g,' ').trim().slice(0,24).trim();
  if(word.length<2)throw new Error('No usable article title');
  const canonical=String(summary?.titles?.canonical||title).replace(/[^a-zA-Z0-9 _-]/g,'').trim();
  botReferences.push({word,title,url:`https://en.wikipedia.org/wiki/${encodeURIComponent(canonical.replace(/ /g,'_'))}`});
  setReferenceStatus('WIKI READY','Bots are using random Wikipedia article titles for word inspiration.');
 }catch(error){
  setReferenceStatus('WIKI OFFLINE','Internet references are unavailable; bots will use their built-in word list.');
 }finally{
  clearTimeout(timeout);referenceRequestPending=false;
 }
}
function botCreate(id){const actor=actorById[id];if(!actor||!actor.alive)return;let referenceIndex=botReferences.findIndex(item=>!state.used.has(item.word.toLowerCase()));const reference=referenceIndex>=0?botReferences.splice(referenceIndex,1)[0]:null;let options=botWords.filter(w=>!state.used.has(w.toLowerCase()));if(!options.length)options=['Nostalgia','Echo Chamber','Staircase'];const word=reference?.word||options[Math.floor(Math.random()*options.length)];spawnWord(word,actor,true,reference);if(state.mode==='survival'&&Math.random()<.25)damage(actor,12);if(!referenceRequestPending&&botReferences.length<2)fetchBotReference();}
function submitWord(word){const actor=actorById.you;if(!actor.alive)return false;if(!word||word.length>24||!/[a-z]/i.test(word)){toast('Use one word to change reality.');return false;}if(state.used.has(word.toLowerCase())){toast('That word has already been used.');$('#word-input').select();return false;}const ok=spawnWord(word,actor);if(ok){state.openingPrompt=false;$('#word-input').value='';state.phase='manifested';state.phaseTime=1.1;$('#word-input').disabled=true;$('#manifest-button').disabled=true;$('#console-hint').textContent='The world has changed. Watch closely.';}return ok;}
$('#word-form').addEventListener('submit',e=>{e.preventDefault();if(!$('#word-input').disabled)submitWord($('#word-input').value.trim());});
$('#word-input').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\s+/g,' ').replace(/[^a-zA-ZéÉ -]/g,'');});
document.querySelectorAll('.mode-option').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.mode!==state.mode)switchMode(btn.dataset.mode);}));
$('#restart-button').addEventListener('click',()=>{restartRound();addEvent('Reality','was reset. Your next idea is yours.','↻');});
$('#modal-action').addEventListener('click',()=>restartRound());
$('#sound-toggle').addEventListener('click',e=>{state.sfx=!state.sfx;e.currentTarget.style.color=state.sfx?'#c8f36b':'#667086';toast(state.sfx?'Sound on':'Sound off');});

function finishGame(won,message){if(state.gameOver)return;state.gameOver=true;$('#modal-title').textContent=won?'Reality, rewritten.':'Reality wins this round.';$('#modal-copy').textContent=message;$('#modal-action').innerHTML=won?'PLAY AGAIN <span>↗</span>':'TRY AGAIN <span>↗</span>';$('#modal').classList.remove('hidden');}
function updateTimer(){const value=Math.ceil(state.phaseTime);$('#timer-value').textContent=String(Math.max(0,value)).padStart(2,'0');const promptDuration=state.openingPrompt?10:5;const ratio=state.phase==='prompt'?state.phaseTime/promptDuration:state.phaseTime/12;const progress=1-THREE.MathUtils.clamp(ratio,0,1);$('#timer-progress').style.strokeDashoffset=String(333*progress);$('#timer-progress').style.stroke=state.phase==='prompt'?'#ff9b7a':state.phaseTime<4?'#ff879a':'#c8f36b';}
function nextCreation(){state.round++;if(state.mode==='survival'){actors.filter(a=>a.alive).forEach(a=>{if(a.id!=='you'&&Math.random()<.24)damage(a,10);});if(state.water>1.3){const you=actorById.you;if(you.group.position.y<.3)damage(you,8);}}
 const alive=actors.filter(a=>a.alive);if(state.mode==='survival'&&alive.length<=1){finishGame(alive[0]?.id==='you',alive[0]?.id==='you'?'You survived the chaos.':'You were eliminated.');return;}
 for(let n=0;n<state.turnOrder.length;n++){state.turnIndex=(state.turnIndex+1)%state.turnOrder.length;const id=state.turnOrder[state.turnIndex];if(actorById[id]?.alive){state.phase='prompt';state.phaseTime=5;setTurn(id);if(id==='you')toast('Creation prompt! One word.');else toast(`${actorById[id].name} is choosing a word.`);return;}}
}
function stepGame(dt){if(state.gameOver)return;state.elapsed+=dt;state.phaseTime-=dt;if(state.phaseTime<=0){if(state.phase==='prompt'){if(state.turn==='you'){addEvent('You','missed the creation window.','⌁');state.openingPrompt=false;startCountdown();}else{const bot=actorById[state.turn];if(bot)botCreate(bot.id);state.phase='manifested';state.phaseTime=1.1;}}else if(state.phase==='manifested')startCountdown();else if(state.phase==='countdown')nextCreation();}
 if(state.phase==='countdown'&&state.phaseTime<=0)state.phaseTime=0;
 updateTimer();
}

window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key)&&document.activeElement!==$('#word-input')){e.preventDefault();keys[key]=true;}if(e.key==='Enter'&&document.activeElement!==$('#word-input')&&!$('#word-input').disabled){e.preventDefault();$('#word-input').focus();}});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
function moveActors(dt,t){for(const a of actors){if(!a.alive)continue;a.bob+=dt*3.1;let dx=0,dz=0;if(a.local){dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);dz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if((keys[' ']||keys.space)&&a.group.position.y<.08){a.vy=7.6;keys[' ']=false;keys.space=false;}}else{const targetX=Math.sin(t*.42+(a.id==='nova'?1:a.id==='pixel'?2:3))*4;const targetZ=Math.cos(t*.32+(a.id==='echo'?2:0))*3;dx=THREE.MathUtils.clamp(targetX-a.group.position.x,-1,1)*.52;dz=THREE.MathUtils.clamp(targetZ-a.group.position.z,-1,1)*.52;}
 if(dx||dz){const len=Math.hypot(dx,dz)||1;const speed=a.local?4.1:1.1;a.group.position.x+=dx/len*speed*dt;a.group.position.z+=dz/len*speed*dt;a.group.rotation.y=Math.atan2(dx,dz);}
 a.group.position.x=THREE.MathUtils.clamp(a.group.position.x,-9,9);a.group.position.z=THREE.MathUtils.clamp(a.group.position.z,-9,9);
 a.vy-=9.8*state.gravity*dt;if(state.gravity===0){a.vy=THREE.MathUtils.clamp(a.vy,-1.2,1.5);}a.group.position.y=Math.max(0,a.group.position.y+a.vy*dt);if(a.group.position.y===0&&a.vy<0)a.vy=0;if(state.water>0&&a.group.position.y<state.water*.45){a.vy+=1.3*dt;}
 a.body.rotation.z=Math.sin(a.bob)*.035;a.ring.rotation.z=t*.4;
 }
 $('#pos-x').textContent=String(Math.round(actorById.you.group.position.x*10)).padStart(2,'0');$('#pos-z').textContent=String(Math.round(actorById.you.group.position.z*10)).padStart(2,'0');
}
function animateObjects(dt,t){for(const o of objects){if(!o.parent)continue;o.rotation.y+=dt*(o.userData.word==='moon'?.08:.35);if(o.userData.word&&/moon|shark|fish|bird|dragon|whale|duck|rubber/.test(o.userData.word)){o.position.y+=Math.sin(t*1.6+o.position.x)*dt*.25;}}}
function renderLoop(now){requestAnimationFrame(renderLoop);const dt=Math.min(.04,(now-lastFrame)/1000);lastFrame=now;stepGame(dt);moveActors(dt,now/1000);animateObjects(dt,now/1000);const you=actorById.you;const target=new THREE.Vector3(you.group.position.x*.25,1.1,you.group.position.z*.15);camera.position.x+=(you.group.position.x*.28-camera.position.x)*dt*.8;camera.position.z+=(17.5-camera.position.z)*dt*.8;camera.lookAt(target);renderer.render(scene,camera);}

showObjective();updatePlayers();addEvent('Reality','is stable. Your first creation window is open.','✦');updateObjectCount();setTurn('you');setReferenceStatus('WIKI CHECKING','Checking whether internet word references are available.');fetchBotReference();requestAnimationFrame(renderLoop);
