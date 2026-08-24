/* ============================================================
   KNOW'E LEDGER — MONTH I SIMULATION
   Reusable scene + financial + decision + progress engine.
============================================================ */
const simulation=document.querySelector('.simulation');
const scenes={zero:document.querySelector('.scene-zero'),two:document.querySelector('.scene-two'),three:document.querySelector('.scene-three'),four:document.querySelector('.scene-four'),five:document.querySelector('.scene-five'),six:document.querySelector('.scene-six')};
const loadingScreen=document.getElementById('loadingScreen');
const trainHorn=document.getElementById('trainHorn');
const cutsceneOverlay=document.getElementById('cutsceneOverlay');
const cutsceneText=document.getElementById('cutsceneText');
const monthTitle=document.getElementById('monthTitle');
const houseSearchOverlay=document.getElementById('houseSearchOverlay');
const searchHomeButton=document.getElementById('searchHomeButton');
const homePanel=document.getElementById('homePanel');
const closeHomePanel=document.getElementById('closeHomePanel');
const availableSavings=document.getElementById('availableSavings');
const notificationLayer=document.getElementById('notificationLayer');
const transportOverlay=document.getElementById('transportOverlay');
const transportDailyMessage=document.getElementById('transportDailyMessage');
const decisionOverlay=document.getElementById('decisionOverlay');
const decisionBack=document.getElementById('decisionBack');
const decisionKicker=document.getElementById('decisionKicker');
const decisionTitle=document.getElementById('decisionTitle');
const decisionDescription=document.getElementById('decisionDescription');
const decisionButtons=document.getElementById('decisionButtons');
const imageSceneOverlay=document.getElementById('imageSceneOverlay');
const imageSceneFrame=document.getElementById('imageSceneFrame');
const imageSceneCaption=document.getElementById('imageSceneCaption');
const expenditureOverlay=document.getElementById('expenditureOverlay');
const expenditureIntro=expenditureOverlay?.querySelector('.expenditure-intro');
const openExpenditureButton=document.getElementById('openExpenditureButton');
const closeExpenditureButton=document.getElementById('closeExpenditureButton');
const expenditureSheet=document.getElementById('expenditureSheet');
const sheetBalance=document.getElementById('sheetBalance');
const transactionList=document.getElementById('transactionList');
const usageChart=document.getElementById('usageChart');
const monthEndOverlay=document.getElementById('monthEndOverlay');
const monthEndCard=monthEndOverlay?.querySelector('.month-end-card');
const dashboardButton=document.getElementById('dashboardButton');
const pauseButton=document.getElementById('pauseButton');
const pauseOverlay=document.getElementById('pauseOverlay');
const resumeButton=document.getElementById('resumeButton');
const exitDashboardButton=document.getElementById('exitDashboardButton');

const API_BASE='http://127.0.0.1:8000';
const ACTIVE_USER_KEY='activeUserId';
const USERS_KEY='users';
const STARTING_MONEY=50000;
const WELCOME_BONUS=25000;
const HOUSE_MATERIAL_COST=3000;
const PARTY_COST=5000;
const PHONE_PRICE=30000;
const EMI_NOW=6000;
const WORKING_DAYS_PER_MONTH=20;
const CHECKPOINT_DAYS=8; // 1 week + 3rd day = 7 + 1 = 8 days

const TIMES={loading:5000,scene2:7000,hornFromEnd:1000,scene3:3000,scene4:2500,nextDay:2000,scene5:2000,videoPlay:5000,curtain:3000,monthDelay:1000,monthVisible:4000,weekTab:2000,img1:4500,img2:3000,transport:3500,office:7000,party:7000,life:5000,check:3000,mall1:3000,mall2:3000,mall3:3000,mallroam:3000,mall4:5000,phone:3000,mall5:7000,mall6:3000,monthEnd:5000};

let userData=null;
let profileLoaded=false;
let paused=false;
let pauseResolvers=[];
let currentDecisionBack=null;
let simulationStarted=false;
let state={
    month:1,currentScene:'loading',completedMonth:0,paused:false,
    balance:STARTING_MONEY,startingMoney:STARTING_MONEY,
    selectedHome:null,houseRent:0,
    transport:{monthlyBase:0,dailyBase:0,daily:0,daysCharged:0,total:0},
    transactions:[],goals:[],debt:0,emiPending:0,decisions:{},
    welcomeBonusReceived:false
};

function wait(ms){return new Promise(resolve=>{const tick=()=>paused?pauseResolvers.push(()=>setTimeout(resolve,ms)):setTimeout(resolve,ms);tick()})}
function money(v){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Math.round(Number(v)||0))}
function activeUser(){try{const id=localStorage.getItem(ACTIVE_USER_KEY);const users=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return users.find(u=>String(u.id)===String(id))||null}catch{return null}}
function userKey(){const u=activeUser();return u?.id?`knowE_month1_${u.id}`:'knowE_month1_guest'}
function progressKey(){const u=activeUser();return u?.id?`knowE_progress_${u.id}`:'knowE_progress_guest'}
function saveLocal(){localStorage.setItem(userKey(),JSON.stringify(state));localStorage.setItem(progressKey(),JSON.stringify({month:state.month,completedMonth:state.completedMonth,currentScene:state.currentScene}))}
function loadLocal(){try{const saved=JSON.parse(localStorage.getItem(userKey())||'null');if(saved&&saved.month===1){state={...state,...saved};state.transactions=saved.transactions||[];state.goals=saved.goals||[];state.decisions=saved.decisions||{};return true}}catch{}return false}
function updateBalance(){if(availableSavings)availableSavings.textContent=money(state.balance)}
function showScene(scene){Object.values(scenes).forEach(s=>s?.classList.remove('active'));scene?.classList.add('active')}
function playHorn(volume=1){if(!trainHorn)return;trainHorn.pause();trainHorn.currentTime=0;trainHorn.volume=volume;trainHorn.play().catch(()=>{})}
function fadeHorn(duration=1800){if(!trainHorn)return;const start=trainHorn.volume,t=performance.now();function f(now){const p=Math.min(1,(now-t)/duration);trainHorn.volume=start*(1-p);if(p<1)requestAnimationFrame(f);else{trainHorn.pause();trainHorn.currentTime=0;trainHorn.volume=1}}requestAnimationFrame(f)}

async function showNotification({app="KNOW'E LEDGER",title,message,duration=2200}){const n=document.createElement('div');n.className='floating-notification';n.innerHTML=`<div class="floating-notification-topline"><div class="floating-app-icon">⌂</div><span>${app}</span><small>NOW</small></div>${title?`<strong>${title}</strong>`:''}${message?`<p>${message}</p>`:''}`;notificationLayer.appendChild(n);requestAnimationFrame(()=>n.classList.add('visible'));await wait(duration);n.classList.remove('visible');await wait(450);n.remove()}
async function showCutscene(text,duration){cutsceneText.textContent=text;cutsceneOverlay.classList.add('visible');cutsceneOverlay.setAttribute('aria-hidden','false');await wait(duration);cutsceneOverlay.classList.remove('visible');cutsceneOverlay.setAttribute('aria-hidden','true');await wait(300)}

function addTransaction(category,amount,description,type='expense'){state.transactions.push({month:state.month,category,amount:Number(amount),description,type,at:new Date().toISOString()});if(type==='expense')state.balance-=Number(amount);else state.balance+=Number(amount);updateBalance();saveLocal()}
async function financialAction({category,amount,description,type='expense',notificationTitle,notificationMessage}){addTransaction(category,amount,description,type);await showNotification({title:notificationTitle||description,message:notificationMessage||`${type==='expense'?money(amount)+' deducted':money(amount)+' credited'}`,duration:2100});await checkpointSave()}

async function loadDbProgress(){const u=activeUser();if(!u?.id)return;try{const r=await fetch(`${API_BASE}/api/simulation-progress?id=${encodeURIComponent(u.id)}`);if(!r.ok)return;const data=await r.json();const latest=(data.progress||[]).filter(x=>x.month===1).pop();if(latest&&latest.completed_month>=1){state.completedMonth=latest.completed_month;state.currentScene=latest.current_scene;state.balance=latest.balance;try{if(latest.state){state={...state,...latest.state}}}catch{}saveLocal()}}catch(e){console.warn('Progress DB read unavailable; using local progress.',e)}}
async function checkpointSave(){saveLocal();const u=activeUser();if(!u?.id)return;try{await fetch(`${API_BASE}/api/simulation-checkpoint`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:String(u.id),username:u.username,month:state.month,current_scene:state.currentScene,completed_month:state.completedMonth,balance:state.balance,state})})}catch(e){console.warn('Checkpoint DB save unavailable; local checkpoint retained.',e)}}

async function loadProfile(){const u=activeUser();if(!u?.id||!u?.username){applyProfileFallback();return}try{const r=await fetch(`${API_BASE}/api/auth-data?username=${encodeURIComponent(u.username)}&id=${encodeURIComponent(u.id)}`);if(!r.ok)throw new Error('Profile unavailable');userData=await r.json();profileLoaded=true;const ex=userData.profile?.expenses||[];const find=(name)=>ex.find(x=>String(x.category).trim().toUpperCase()===name);const salary=Number(userData.profile?.salary||0);const housing=find('HOUSING');const transport=find('TRANSPORTATION')||find('TRANSPORT')||find('TRAVEL');let rent=Number(housing?.amount||0);if(!rent&&salary)rent=salary*Number(housing?.percentage||0)/100;state.transport.monthlyBase=Number(transport?.amount||0);if(!state.transport.monthlyBase&&salary)state.transport.monthlyBase=salary*Number(transport?.percentage||0)/100;applyHousing(rent||10000);calculateTransport();saveLocal()}catch(e){console.warn(e);applyProfileFallback()}}
function applyProfileFallback(){applyHousing(10000);state.transport.monthlyBase=3000;calculateTransport()}
function applyHousing(base){const vals={starter:Math.round(base),comfort:Math.round(base*1.3),premium:Math.round(base*.5)};document.getElementById('starterRent').textContent=`${money(vals.starter)} / MONTH`;document.getElementById('comfortRent').textContent=`${money(vals.comfort)} / MONTH`;document.getElementById('premiumRent').textContent=`${money(vals.premium)} / MONTH`;window.homeRentData=vals}
function calculateTransport(){const baseDaily=state.transport.monthlyBase/30;const home=state.selectedHome;const factor=home==='comfort'?.7:home==='premium'?2.2:1;state.transport.dailyBase=baseDaily;state.transport.daily=baseDaily*factor;state.transport.total=Math.round(state.transport.daily*CHECKPOINT_DAYS)}

function openHomePanel(){houseSearchOverlay.classList.remove('visible');houseSearchOverlay.setAttribute('aria-hidden','true');homePanel.classList.add('visible');homePanel.setAttribute('aria-hidden','false');updateBalance()}
function closeHome(){homePanel.classList.remove('visible');homePanel.setAttribute('aria-hidden','true')}
function activateSlide(i){document.querySelectorAll('.home-slide').forEach((s,n)=>s.classList.toggle('active',n===i));document.querySelectorAll('.slide-nav').forEach((b,n)=>b.classList.toggle('active',n===i))}

document.querySelectorAll('.slide-nav').forEach(b=>b.addEventListener('click',()=>activateSlide(Number(b.dataset.slide))));
closeHomePanel?.addEventListener('click',closeHome);searchHomeButton?.addEventListener('click',openHomePanel);
document.querySelectorAll('.slide-button').forEach(b=>b.addEventListener('click',()=>selectHome(b.dataset.home)));

async function selectHome(homeType){const rent=Number(window.homeRentData?.[homeType]||0);if(!rent)return;if(rent>state.balance){await showNotification({title:'NOT ENOUGH MONEY',message:`You need ${money(rent)} but have ${money(state.balance)} in hand.`});return}state.selectedHome=homeType;state.houseRent=rent;calculateTransport();await financialAction({category:'HOUSING',amount:rent,description:'House rent',notificationTitle:'HOUSE RENT PAID',notificationMessage:`${money(rent)} deducted. Money in hand: ${money(state.balance)}`});closeHome();await showHouseMaterials()}

async function showVideoScene(src,duration){const v=document.createElement('video');v.className='scene-temp-video';v.src=src;v.muted=true;v.playsInline=true;v.autoplay=true;v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:126;background:#000';simulation.appendChild(v);await new Promise(r=>{v.oncanplay=()=>r();v.onerror=()=>r()});v.play().catch(()=>{});await wait(duration);v.pause();v.remove()}
async function showImageScene(src,duration,caption='',vibrate=false){imageSceneFrame.style.backgroundImage=`url("${src}")`;imageSceneCaption.textContent=caption;imageSceneOverlay.classList.toggle('vibrate',vibrate);imageSceneOverlay.classList.add('visible');imageSceneOverlay.setAttribute('aria-hidden','false');await wait(duration);imageSceneOverlay.classList.remove('visible','vibrate');imageSceneOverlay.setAttribute('aria-hidden','true');await wait(250)}
async function showHouseMaterials(){await showCutscene('YOU BOUGHT SOME HOUSE MATERIALS',1700);await financialAction({category:'MATERIALS',amount:HOUSE_MATERIAL_COST,description:'House materials',notificationTitle:'HOUSE MATERIALS',notificationMessage:`${money(HOUSE_MATERIAL_COST)} deducted.`});await showTransportChoice()}
async function showTransportChoice(){calculateTransport();transportDailyMessage.textContent=`${money(state.transport.daily)} per working day`;transportOverlay.classList.add('visible');transportOverlay.setAttribute('aria-hidden','false');await wait(TIMES.transport);transportOverlay.classList.remove('visible');transportOverlay.setAttribute('aria-hidden','true');state.currentScene='transport-selected';saveLocal();await checkpointSave();await weekLaterSequence();}
async function weekLaterSequence(){await showCutscene('A WEEK LATER',TIMES.weekTab);await showImageScene('../../assets/IMG1.jpeg',TIMES.img1,'');await showImageScene('../../assets/IMG2.jpeg',TIMES.img2,'',true);if(!state.welcomeBonusReceived){state.welcomeBonusReceived=true;addTransaction('BONUS',WELCOME_BONUS,'Welcome bonus','income');updateBalance();await checkpointSave();await showNotification({app:'KNOW’E LEDGER • OFFICE',title:'WELCOME BONUS',message:`${money(WELCOME_BONUS)} credited to your available money.`});await showNotification({app:'YOUR BANK',title:'₹25,000 CREDITED',message:`Your account balance is now ${money(state.balance)}.`})}await showArrival()}
async function showArrival(){await showCutscene('YOU ARRIVED TO YOUR OFFICE',1800);await showImageScene('../../assets/office1.jpeg',TIMES.office,'');await openOfficeDecision()}

function openDecision({kicker,title,description,options,back=true}){decisionKicker.textContent=kicker;decisionTitle.textContent=title;decisionDescription.textContent=description||'';decisionButtons.innerHTML='';decisionBack.classList.toggle('hidden',!back);options.forEach(o=>{const b=document.createElement('button');b.textContent=o.label;b.dataset.action=o.value;if(o.disabled)b.classList.add('disabled');b.disabled=!!o.disabled;b.addEventListener('click',()=>o.onClick());decisionButtons.appendChild(b)});decisionOverlay.classList.add('visible');decisionOverlay.setAttribute('aria-hidden','false')}
function closeDecision(){decisionOverlay.classList.remove('visible');decisionOverlay.setAttribute('aria-hidden','true')}
async function openOfficeDecision(){openDecision({kicker:'OFFICE INVITATION',title:'JOIN THE PARTY?',description:'A new invitation has arrived. Choose what you want to do.',options:[{label:'YES',value:'yes',onClick:()=>officeChoice('yes')},{label:'NO',value:'no',onClick:()=>officeChoice('no')},{label:'POSTPONE',value:'postpone',onClick:()=>officeChoice('postpone')}],back:false})}
async function officeChoice(choice){state.decisions.office=choice;saveLocal();currentDecisionBack=openOfficeDecision;openDecision({kicker:'OFFICE DECISION',title:choice==='yes'?'YES — PARTY':choice==='no'?'NO — SKIP':'POSTPONE',description:'Your other choices are hidden. Use BACK if you want to reconsider.',options:[{label:'CONTINUE',value:'continue',onClick:()=>confirmOfficeChoice(choice)}],back:true})}
async function confirmOfficeChoice(choice){closeDecision();currentDecisionBack=null;await checkpointSave();if(choice==='yes'){await showVideoScene('../../assets/party1.mp4',TIMES.party);await financialAction({category:'PARTY',amount:PARTY_COST,description:'Office party',notificationTitle:'PARTY EXPENSE',notificationMessage:`${money(PARTY_COST)} deducted.`})}else if(choice==='no'){await showVideoScene('../../assets/life1.mp4',TIMES.life)}await nightScene()}

async function nightScene(){await showCutscene('THAT NIGHT',1600);await showNotification({app:'MESSAGES',title:'FRIEND',message:'I have arrived.',duration:1700});await showNotification({app:'MESSAGES',title:'FRIEND',message:"Let’s meet up.",duration:1900});await showImageScene('../../assets/check1.jpeg',TIMES.check,'');await openExpenditurePrompt()}
async function openExpenditurePrompt(){if(state.transport.daysCharged<CHECKPOINT_DAYS&&state.transport.daily>0){const amount=Math.round(state.transport.daily*CHECKPOINT_DAYS);state.transport.daysCharged=CHECKPOINT_DAYS;state.transport.total=amount;await financialAction({category:'TRANSPORT',amount,description:`Public transport for ${CHECKPOINT_DAYS} days`,notificationTitle:'TRANSPORTATION',notificationMessage:`${money(amount)} deducted for ${CHECKPOINT_DAYS} days of public transport.`})}expenditureOverlay.classList.add('visible');expenditureOverlay.setAttribute('aria-hidden','false');renderExpenditure();}
function renderExpenditure(){sheetBalance.textContent=money(state.balance);transactionList.innerHTML=state.transactions.filter(t=>t.month===1).map(t=>`<div class="transaction-row"><span>${t.category}<small> ${t.description}</small></span><strong>${t.type==='expense'?'−':'+'}${money(t.amount)}</strong></div>`).join('')||'<div class="transaction-row"><span>No transactions yet</span><strong>—</strong></div>';const sums={};state.transactions.filter(t=>t.month===1&&t.type==='expense').forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);const max=Math.max(1,...Object.values(sums));usageChart.innerHTML=Object.entries(sums).map(([k,v])=>`<div class="usage-row"><span>${k}</span><div class="usage-bar"><span style="width:${Math.max(4,v/max*100)}%"></span></div><b>${money(v)}</b></div>`).join('')}
openExpenditureButton?.addEventListener('click',()=>{renderExpenditure();expenditureSheet.classList.add('open')});closeExpenditureButton?.addEventListener('click',()=>expenditureSheet.classList.remove('open'));

async function continueFromExpenditure(){expenditureOverlay.classList.remove('visible');expenditureSheet.classList.remove('open');expenditureOverlay.setAttribute('aria-hidden','true');state.currentScene='mall';await checkpointSave();await mallSequence()}
openExpenditureButton?.addEventListener('dblclick',continueFromExpenditure);
// The first click opens the sheet; a second click on the same button continues is replaced by this explicit helper below.
const continueBtn=document.createElement('button');continueBtn.id='continueExpenditureButton';continueBtn.type='button';continueBtn.textContent='CONTINUE';continueBtn.style.cssText='display:block;margin:22px auto 0;padding:12px 22px;border:0;border-radius:8px;background:#111;color:#fff;font-weight:800;cursor:pointer';expenditureIntro?.appendChild(continueBtn);continueBtn.addEventListener('click',continueFromExpenditure);

async function mallSequence(){const imgs=[['img-mall1.jpeg',TIMES.mall1],['img-mall2.jpeg',TIMES.mall2],['img-mall3.jpeg',TIMES.mall3],['img-mallroam.jpeg',TIMES.mallroam],['img-mall4.jpeg',TIMES.mall4],['img-phone1.jpeg',TIMES.phone],['img-mall5.jpeg',TIMES.mall5]];for(const [file,time] of imgs){await showImageScene(`../../assets/${file}`,time,'')}await phoneDecision()}
async function phoneDecision(){openDecision({kicker:'PURCHASE DECISION',title:'WHAT WILL YOU DO?',description:'The phone costs ₹30,000. Your choice changes your future financial state.',options:[{label:'BUY NOW',value:'buy-now',onClick:()=>phoneBuyNow()},{label:'DELAY PURCHASE',value:'delay',onClick:()=>phoneChoice('delay')},{label:'SAVE FOR IT',value:'save',onClick:()=>phoneChoice('save')},{label:'NOT BUY',value:'not-buy',onClick:()=>phoneChoice('not-buy')}],back:false})}
function decisionSub(options,title,description){openDecision({kicker:'PHONE',title,description,options,back:true})}
decisionBack?.addEventListener('click',()=>{if(currentDecisionBack)currentDecisionBack();else phoneDecision()});
function phoneBuyNow(){currentDecisionBack=phoneDecision;decisionSub([{label:'BUY',value:'buy',disabled:state.balance<PHONE_PRICE,onClick:()=>completePhoneBuy()},{label:'BORROW',value:'borrow',onClick:()=>completeBorrow()},{label:'EMI',value:'emi',onClick:()=>completeEMI()}],'BUY NOW','Choose how to pay for the ₹30,000 phone.')} 
async function completePhoneBuy(){closeDecision();await financialAction({category:'PHONE',amount:PHONE_PRICE,description:'Phone purchased with cash',notificationTitle:'PHONE PURCHASE',notificationMessage:`${money(PHONE_PRICE)} deducted. Phone purchased.`});await afterPhoneChoice()}
async function completeBorrow(){closeDecision();state.debt+=PHONE_PRICE;state.decisions.phonePayment='borrow';saveLocal();await financialAction({category:'LOAN',amount:PHONE_PRICE,description:'Phone borrowed / loan received',type:'income',notificationTitle:'LOAN RECEIVED',notificationMessage:`${money(PHONE_PRICE)} credited. Debt recorded: ${money(state.debt)}.`});await afterPhoneChoice()}
async function completeEMI(){closeDecision();state.emiPending+=PHONE_PRICE-EMI_NOW;state.decisions.phonePayment='emi';saveLocal();await financialAction({category:'PHONE EMI',amount:EMI_NOW,description:'Phone EMI paid now',notificationTitle:'PHONE EMI',notificationMessage:`${money(EMI_NOW)} deducted. ${money(state.emiPending)} EMI pending.`});await afterPhoneChoice()}
async function phoneChoice(choice){state.decisions.phoneChoice=choice;currentDecisionBack=phoneDecision;openDecision({kicker:'PHONE DECISION',title:choice==='save'?'SAVE FOR IT':choice==='delay'?'DELAY PURCHASE':'NOT BUY',description:'Your other purchase choices are hidden. Use BACK if you want to reconsider.',options:[{label:'CONTINUE',value:'continue',onClick:()=>confirmPhoneChoice(choice)}],back:true})}
async function confirmPhoneChoice(choice){closeDecision();currentDecisionBack=null;if(choice==='save'){if(!state.goals.find(g=>g.name==='PHONE'))state.goals.push({name:'PHONE',target:PHONE_PRICE,saved:0});await showNotification({title:'GOAL CREATED',message:'PHONE added to Goals & Savings: ₹30,000 target.'})}else await showNotification({title:choice==='delay'?'PURCHASE DELAYED':'PURCHASE SKIPPED',message:'No money was deducted.'});saveLocal();await checkpointSave();await afterPhoneChoice()}
async function afterPhoneChoice(){await showNotification({title:'FINANCIAL STATE UPDATED',message:`Money in hand: ${money(state.balance)}`});await showImageScene('../../assets/img-mall6.jpeg',TIMES.mall6,'');await finishMonth()}

async function finishMonth(){state.completedMonth=1;state.currentScene='month1-complete';saveLocal();await checkpointSave();monthEndOverlay.classList.add('visible');monthEndOverlay.setAttribute('aria-hidden','false');await wait(TIMES.monthEnd);monthEndCard?.classList.add('hidden');dashboardButton.classList.add('visible')}

dashboardButton?.addEventListener('click',()=>{window.location.href='../MAIN/main.HTML'});exitDashboardButton?.addEventListener('click',()=>window.location.href='../MAIN/main.HTML');

function setPaused(value){paused=value;state.paused=value;pauseOverlay.classList.toggle('visible',value);pauseOverlay.setAttribute('aria-hidden',String(!value));if(!value){const r=pauseResolvers.splice(0);r.forEach(fn=>fn())}if(scenes.six){if(value)scenes.six.pause();else if(state.currentScene==='scene6')scenes.six.play().catch(()=>{})}if(trainHorn){if(value)trainHorn.pause()}}
pauseButton?.addEventListener('click',()=>setPaused(true));resumeButton?.addEventListener('click',()=>setPaused(false));

async function startSceneSix(){showScene(scenes.six);state.currentScene='scene6';saveLocal();scenes.six.currentTime=0;simulation.classList.add('curtain-active');scenes.six.play().catch(()=>{});await wait(TIMES.curtain);simulation.classList.remove('curtain-active');await wait(TIMES.monthDelay);monthTitle.classList.add('visible');await wait(TIMES.videoPlay-TIMES.curtain);scenes.six.pause();await wait(TIMES.monthVisible);monthTitle.classList.remove('visible');await checkpointSave();houseSearchOverlay.classList.add('visible');houseSearchOverlay.setAttribute('aria-hidden','false')}

async function runSequence(){if(simulationStarted)return;simulationStarted=true;loadLocal();await loadDbProgress();if(state.completedMonth>=1){loadingScreen.classList.add('hidden');await showCutscene('MONTH I COMPLETE',1800);openDecision({kicker:'PROGRESS',title:'MONTH I COMPLETE',description:'You can replay Month I. Month II is coming soon.',options:[{label:'REPLAY',value:'replay',onClick:()=>{localStorage.removeItem(userKey());location.reload()}}],back:false});return}state.balance=STARTING_MONEY;state.startingMoney=STARTING_MONEY;updateBalance();loadProfile();const assets=['../../assets/scene2.jpeg','../../assets/scene3.jpeg','../../assets/scene4.jpeg','../../assets/scene5.jpeg','../../assets/scene6.mp4','../../assets/house1.jpeg','../../assets/house2.jpeg','../../assets/house3.jpeg','../../assets/IMG1.jpeg','../../assets/IMG2.jpeg'];await Promise.all([wait(TIMES.loading),...assets.map(src=>new Promise(r=>{if(src.endsWith('.mp4')){const v=document.createElement('video');v.preload='auto';v.src=src;v.oncanplaythrough=()=>r();v.onerror=()=>r()}else{const i=new Image();i.onload=()=>r();i.onerror=()=>r();i.src=src}}))]);loadingScreen.classList.add('hidden');
showScene(scenes.two);state.currentScene='scene2';window.setTimeout(()=>playHorn(1),TIMES.scene2-TIMES.hornFromEnd);await wait(TIMES.scene2);
showScene(scenes.three);state.currentScene='scene3';await wait(TIMES.scene3);
showScene(scenes.four);state.currentScene='scene4';playHorn(.18);fadeHorn(TIMES.scene4);await wait(TIMES.scene4);
await showCutscene('NEXT DAY',TIMES.nextDay);
showScene(scenes.five);state.currentScene='scene5';await wait(TIMES.scene5);
await startSceneSix();
}

runSequence();
