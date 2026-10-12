'use strict';
(() => {
  const lessons = window.BOOK_LESSONS;
  const $ = id => document.getElementById(id);
  const STORAGE = 'slow-reader:v1';
  const defaults = {font:22, line:2, spacing:0.02, theme:'paper', rate:0.85, voice:''};
  const glossary = {
    '神論':'討論神是否存在，以及神有甚麼性情的學問。這是本書第一部的主題。',
    '心靈':'這裡指人的內在感受、思想和良心，不是身體的某個器官。',
    '唯物主義':'一種認為物質是世界根本的哲學立場。原書對這個立場有自己的批評。',
    '創造':'本書用來說明神使天地、萬物和人存在。',
    '創世記':'聖經的第一卷書，記載創造、人的起源等故事。',
    '解經':'解釋經文的意思。同一段經文，不同的人可能有不同理解。',
    '至大':'本書用來形容神不受人的能力、時間和空間所限制。',
    '永生':'在本書中，不只是活得很久，而是與神同在的生命。',
    '信靠':'相信，也願意依靠。在本書中，對象是神和耶穌。',
    '靈':'本書用來說明不屬於物質身體的存在。「神是靈」是其中一個信仰主張。',
    '形像':'不一定只指外貌。作者談神的形像時，也強調慈愛、公義等品格。',
    '無所不在':'本書指神不被某一個地點限制，不是只有在指定建築物才能親近祂。',
    '無所不知':'本書指神沒有不知道的事，包括人的內心。',
    '禱告':'向神表達感謝、需要、疑問或心裡的話。',
    '理性':'運用思考和理由，嘗試理解或判斷事情的能力。',
    '起誓':'鄭重作出承諾，表明自己會守信。',
    '信實':'可靠、守信用，不輕易背棄承諾。',
    '應許':'承諾。本書通常用來指神答應人的事。',
    '至聖':'完全聖潔。作者用來形容神沒有罪惡的性情。',
    '罪':'本書的宗教用語，指違背神旨意的思想或行為，不只指法律上的犯罪。',
    '悔改':'承認自己的過錯，並願意回轉、改變方向。',
    '公義':'重視對錯，並以正直的方式判斷和對待。',
    '慈愛':'關懷、愛護，也願意幫助。在本書中，特別指神對人的愛。',
    '救贖':'本書指耶穌付上代價，使人從罪的困境中得救。',
    '報應':'按照善惡得到相應結果。本書把這與神最終的審判連起來。',
    '審判':'按一個標準作出判斷。本書主要談神對人的善惡作最終判斷。',
    '來生':'死亡以後的生命。這是本書所相信的信仰前提。',
    '公平':'按合宜的原則對待。作者強調，公平不一定等於人人經歷相同。',
    '恩典':'不是靠功勞交換，卻白白得到的好處。本書特別用來說明神的救恩。',
    '知足':'看見和珍惜已經擁有的，不只與別人比較。這不等於忽略不公義。',
    '預定':'本書指神預先有計劃、安排結局的觀念。不同神學傳統有不同理解。',
    '自由意志':'人作出選擇的能力。作者討論它與神預定之間的關係。',
    '救恩':'本書指神藉耶穌拯救人，讓人得赦免、與神恢復關係。',
    '天父':'基督教對神的一種稱呼，表達人與神之間的關係。',
    '三位一體':'基督教描述獨一的神，同時談聖父、聖子、聖靈的用語；不是指三位不同的神。',
    '聖父':'三位一體中的一位。本章敘述特別着重祂的創造、引導和教導。',
    '聖子':'三位一體中的一位，指耶穌基督。本章特別着重祂成就救贖。',
    '聖靈':'三位一體中的一位。本章特別着重祂與人同在、安慰和引導。'
  };
  const clamp = (v,min,max,fallback) => Number.isFinite(Number(v)) ? Math.max(min,Math.min(max,Number(v))) : fallback;
  let storageAvailable = true;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE) || '{}') || {}; } catch { storageAvailable = false; }
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const pref = saved.settings && typeof saved.settings === 'object' ? saved.settings : {};
  let settings = {
    font:clamp(pref.font ?? defaults.font,18,32,22), line:clamp(pref.line ?? defaults.line,1.6,2.6,2),
    spacing:[0.02,0.08,0.14].includes(Number(pref.spacing)) ? Number(pref.spacing) : 0.02,
    theme:['paper','white','dark'].includes(pref.theme) ? pref.theme : 'paper',
    rate:clamp(pref.rate ?? defaults.rate,0.5,1.2,0.85), voice:typeof pref.voice === 'string' ? pref.voice : ''
  };
  const validIds = list => Array.isArray(list) ? [...new Set(list.filter(n=>Number.isInteger(n)&&n>=1&&n<=14))] : [];
  const done = new Set(validIds(saved.done));
  const bookmarks = new Set(validIds(saved.bookmarks));
  const positions = {};
  lessons.forEach(l => {
    const v = saved.positions?.[l.id] || {};
    positions[l.id] = { easy:Math.floor(clamp(v.easy ?? 0,0,3,0)), original:Math.floor(clamp(v.original ?? 0,0,l.original.length-1,0)) };
  });
  let chapter = lessons[0], mode = saved.mode === 'original' ? 'original' : 'easy';
  let onlyBookmarks = false, focusMode = false, quizSelection = null, hintOpen = false;
  const speech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
  let voices = [], speechToken = 0, speechState = 'idle', activeUtterance = null;
  let quizSelections = {};
  const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function announce(text) { $('announcement').textContent = text; }
  function persist() {
    try {
      localStorage.setItem(STORAGE,JSON.stringify({version:1,settings,done:[...done],bookmarks:[...bookmarks],positions,chapter:chapter.id,mode}));
      storageAvailable = true;
    } catch { storageAvailable = false; }
    $('progress-sub').textContent = storageAvailable ? (done.size ? '隨時回來，接着上次的位置讀' : '從任何一章開始都可以') : '此瀏覽器未能儲存進度；目前仍可閱讀';
  }
  function applySettings() {
    document.documentElement.style.setProperty('--read-size',settings.font+'px');
    document.documentElement.style.setProperty('--read-line',String(settings.line));
    document.documentElement.style.setProperty('--read-space',settings.spacing+'em');
    document.body.dataset.theme = settings.theme;
    $('font-size').value = settings.font; $('font-output').value = settings.font+' px';
    $('line-height').value = settings.line; $('line-output').value = settings.line.toFixed(1)+' 倍';
    $('letter-spacing').value = settings.spacing; $('theme').value = settings.theme;
    $('speech-rate').value = settings.rate; $('rate-output').value = settings.rate.toFixed(2)+' 倍';
    if (voices.length) $('voice').value = settings.voice;
  }
  function renderProgress() {
    $('overall-meter').value = done.size;
    $('progress-number').textContent = `${done.size} / 14 章`;
    $('progress-label').textContent = done.size === 14 ? '十四章都留下了你的足跡' : '你的閱讀旅程';
    persist();
  }
  function renderCatalog() {
    const query = $('chapter-search').value.trim().toLocaleLowerCase();
    const found = lessons.filter(l => (!onlyBookmarks || bookmarks.has(l.id)) && [l.title,l.short,...l.terms].join(' ').toLocaleLowerCase().includes(query));
    $('chapter-count').textContent = `${found.length} 章`;
    let group = '';
    $('chapter-list').innerHTML = found.map(l => {
      let title = '';
      if (l.group !== group) { group = l.group; title = `<h3 class="chapter-group">${escapeHTML(group)}</h3>`; }
      return title+`<a href="#chapter-${l.id}" class="chapter-link" ${l.id===chapter.id?'aria-current="true"':''}><span class="chapter-num">${String(l.id).padStart(2,'0')}</span><span class="chapter-name">${escapeHTML(l.title)}</span>${done.has(l.id)?'<span class="chapter-check" aria-label="已讀完">✓</span>':bookmarks.has(l.id)?'<span class="chapter-check" aria-label="已收藏">★</span>':''}</a>`;
    }).join('') || `<p class="empty-state">${onlyBookmarks?'這裡還沒有符合的收藏。按章節旁的星星，就能收藏。':'找不到這個章節。試試「恩典」或「神」。'}</p>`;
  }
  function renderTerms(target, terms) {
    $(target).innerHTML = terms.map(word => `<details class="term"><summary>${escapeHTML(word)}</summary><p>${escapeHTML(glossary[word])}</p></details>`).join('') || '<p class="empty-state">找不到這個詞語，試試另一個詞。</p>';
  }
  function renderAllTerms() {
    const query = $('glossary-search').value.trim();
    renderTerms('all-glossary',Object.keys(glossary).filter(w=>w.includes(query)||glossary[w].includes(query)));
  }
  function updateBookmark() {
    const marked = bookmarks.has(chapter.id);
    $('bookmark').textContent = marked ? '★' : '☆';
    $('bookmark').setAttribute('aria-pressed',String(marked));
    $('bookmark').setAttribute('aria-label',marked?'取消收藏這一章':'收藏這一章');
  }
  function total() { return mode==='easy' ? 4 : chapter.original.length; }
  function current() { return positions[chapter.id][mode]; }
  function renderCard(focus = false) {
    stopSpeech();
    const step = current(), count = total();
    $('reading-panel').setAttribute('aria-labelledby',mode==='easy'?'easy-tab':'original-tab');
    $('card-count').textContent = `${step+1} / ${count} 小段`;
    const dotCount = mode==='easy'?4:8, dotActive = mode==='easy'?step:Math.min(7,Math.floor(step/count*8));
    $('step-dots').innerHTML = Array.from({length:dotCount},(_,i)=>`<span aria-hidden="true" class="${i===dotActive?'current':i<dotActive?'passed':''}"></span>`).join('');
    $('step-dots').setAttribute('aria-label',`第 ${step+1} 小段，共 ${count} 小段`);
    $('quiz-feedback').textContent = '';
    $('takeaway').replaceChildren();
    if (mode==='original') {
      const item = chapter.original[step];
      $('card-label').textContent = '原文對照';
      $('card-title').textContent = `原書第 ${item.page} 頁`;
      const p = document.createElement('p'); p.textContent = item.text; $('card-body').replaceChildren(p);
      $('takeaway').innerHTML = '';
    } else if (step<3) {
      const card = chapter.cards[step];
      $('card-label').textContent = card.label; $('card-title').textContent = card.title;
      $('card-body').innerHTML = card.lines.map(line=>`<p>${escapeHTML(line)}</p>`).join('');
      $('takeaway').innerHTML = `<small>記住這一句就好</small>${escapeHTML(card.takeaway)}`;
    } else {
      const q = chapter.quiz;
      $('card-label').textContent = '輕輕想一想'; $('card-title').textContent = q.question;
      $('card-body').innerHTML = '<p class="quiz-intro">選最接近作者意思的一項。<br>不用寫字，也不用急着答。</p><div class="quiz-options">'+q.options.map((o,i)=>`<button class="quiz-option" data-answer="${i}" aria-pressed="false"><span class="option-letter" aria-hidden="true">${String.fromCharCode(65+i)}</span><span>${escapeHTML(o)}</span></button>`).join('')+'</div><button class="text-button hint-button" id="hint" aria-expanded="false" aria-controls="hint-content">先看一點提示 ＋</button><p class="hint" id="hint-content" hidden></p>';
      if (hintOpen) revealHint();
      if (Number.isInteger(quizSelections[chapter.id])) showAnswer(quizSelections[chapter.id],false);
      $('takeaway').innerHTML = '<small>沒有分數，也不用表態</small>這題只幫你理解書中意思。你可以重試、看提示，或先記下已讀完。';
    }
    $('prev').disabled = step===0;
    const atEnd = step===count-1;
    $('next').textContent = atEnd ? (done.has(chapter.id)?(chapter.id===14?'回到第一章 ↗':'讀下一章 →'):'記下這章已讀完 ✓') : '下一小段 →';
    $('navigation-label').textContent = mode==='easy' ? '按你的步伐來' : `第 ${step+1} 小段`;
    $('completion').textContent = done.has(chapter.id) ? '✓ 這章已記下讀完，仍可隨時重讀。' : '';
    $('mode-note').textContent = mode==='easy' ? '依作者觀點整理 · 導讀非原文' : '保留原書文字';
    persist();
    if (focus) { $('card-title').focus({preventScroll:true}); $('reading-panel').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); }
  }
  function renderChapter(focus=false) {
    quizSelection = null; hintOpen = false;
    $('chapter-meta').textContent = `第一部 · 第 ${String(chapter.id).padStart(2,'0')} 章 / 14　·　原書 ${chapter.pages[0]}–${chapter.pages[1]} 頁`;
    $('chapter-title').textContent = chapter.title;
    $('chapter-subtitle').textContent = chapter.short;
    document.title = `${chapter.title} · 慢慢讀`;
    $('source-page').min=chapter.pages[0]; $('source-page').max=chapter.pages[1]; $('source-page').value=chapter.pages[0];
    $('page-help').textContent = `本章原書第 ${chapter.pages[0]}–${chapter.pages[1]} 頁。`;
    renderCatalog();renderTerms('chapter-glossary',chapter.terms);updateBookmark();updateTabs();renderCard();renderProgress();
    if (focus) { $('reader').focus({preventScroll:true}); $('reader').scrollIntoView({block:'start'}); }
  }
  function updateTabs() {
    ['easy','original'].forEach(name=>{
      $(`${name}-tab`).setAttribute('aria-selected',String(name===mode));
      $(`${name}-tab`).tabIndex=name===mode?0:-1;
    });
  }
  function setMode(nextMode,focusCard=false) { mode=nextMode;updateTabs();renderCard(focusCard); }
  function readRoute(focus=false) {
    const id = Number(location.hash.match(/^#chapter-(\d+)$/)?.[1]);
    if (id>=1 && id<=lessons.length) {
      chapter=lessons[id-1];
      $('catalog-body').classList.remove('open'); $('catalog-toggle').setAttribute('aria-expanded','false'); $('catalog-toggle').textContent='展開目錄';
      renderChapter(focus);
    }
  }
  function revealHint() {
    hintOpen=true; $('hint-content').hidden=false; $('hint-content').textContent=chapter.quiz.hint;
    $('hint').setAttribute('aria-expanded','true'); $('hint').textContent='提示已展開';
  }
  function showAnswer(index,announceResult=true) {
    quizSelection=index; quizSelections[chapter.id]=index;
    document.querySelectorAll('.quiz-option').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.answer)===index)));
    const correct=index===chapter.quiz.answer;
    $('quiz-feedback').textContent = correct ? '你抓到這個重點了。'+chapter.quiz.explanation : '我們再看看：'+chapter.quiz.hint+' 你可以再選一次，也可以先休息。';
    if (announceResult) announce(correct?'你抓到這個重點了。':'可以再看看提示，然後重試。');
  }
  function stepBy(delta) {
    const next=current()+delta;
    if (next>=0 && next<total()) {positions[chapter.id][mode]=next;renderCard(true);}
  }
  function stopSpeech(message) {
    speechToken++; if (speech) speech.cancel(); activeUtterance=null;speechState='idle';
    document.querySelectorAll('.spoken').forEach(p=>p.classList.remove('spoken'));
    $('speak').innerHTML='<span aria-hidden="true">▷</span> 聽這一段';
    $('speech-stop').disabled=true;
    $('audio-status').textContent=message || (speech?'可以跟着文字慢慢聽':'這個瀏覽器未支援朗讀，可使用裝置的輔助朗讀');
    $('speak').disabled=!speech;
  }
  function populateVoices() {
    if (!speech) return;
    voices=speech.getVoices().filter(v=>/^zh|^yue|^cmn/i.test(v.lang));
    const select=$('voice');select.replaceChildren(new Option('自動選擇中文語音',''));
    voices.forEach(v=>select.add(new Option(`${v.name} · ${v.lang}`,v.voiceURI)));
    if (voices.some(v=>v.voiceURI===settings.voice))select.value=settings.voice;
    else if (settings.voice && voices.length) { settings.voice='';persist(); }
  }
  function speak() {
    if (!speech) return;
    if (speechState==='speaking') {speech.pause();speechState='paused';$('speak').textContent='▷ 繼續朗讀';$('audio-status').textContent='已暫停；可以隨時繼續';return;}
    if (speechState==='paused') {speech.resume();speechState='speaking';$('speak').textContent='Ⅱ 暫停朗讀';$('audio-status').textContent='正在朗讀這一段';return;}
    stopSpeech(); populateVoices();
    const items = [{text:$('card-title').textContent,node:$('card-title')}];
    $('card-body').querySelectorAll('p:not([hidden]), .quiz-option').forEach(node=>items.push({text:node.textContent,node}));
    if ($('takeaway').textContent)items.push({text:$('takeaway').textContent,node:$('takeaway')});
    // Short utterances avoid long-text voice limits. Only speak this card, never advance automatically.
    const queue=items.flatMap(item=>{
      const chunks=item.text.match(/[^。！？；\n]+[。！？；\n]?/g)||[item.text];
      return chunks.flatMap(text=>Array.from({length:Math.ceil(text.length/110)},(_,i)=>({text:text.slice(i*110,(i+1)*110),node:item.node})));
    }).filter(item=>item.text.trim());
    const token=++speechToken;
    speechState='speaking'; $('speak').textContent='Ⅱ 暫停朗讀';$('speech-stop').disabled=false;
    $('audio-status').textContent='正在朗讀；目前的句子會標亮';
    const voice=voices.find(v=>v.voiceURI===settings.voice)||voices.find(v=>/zh[-_]HK|yue/i.test(v.lang))||voices.find(v=>/zh[-_]TW/i.test(v.lang))||voices[0];
    if (!voice) {stopSpeech('未找到中文語音。請在裝置安裝中文語音，再試一次。');return;}
    let position=0;
    function playNext() {
      if (token!==speechToken)return;
      if (position>=queue.length) {stopSpeech('這一段聽完了。準備好再到下一段。');return;}
      const item=queue[position++]; const u=new SpeechSynthesisUtterance(item.text); activeUtterance=u;
      u.lang=voice.lang;u.voice=voice;u.rate=settings.rate;
      u.onstart=()=>{if(token===speechToken){document.querySelectorAll('.spoken').forEach(n=>n.classList.remove('spoken'));item.node.classList.add('spoken');}};
      u.onend=playNext;
      u.onerror=e=>{if(token===speechToken && !['interrupted','canceled'].includes(e.error))stopSpeech('暫時無法朗讀。可在閱讀設定換一個中文語音。');};
      speech.speak(u);
    }
    playNext();
  }
  $('prev').addEventListener('click',()=>stepBy(-1));
  $('next').addEventListener('click',()=>{
    if (current()<total()-1) return stepBy(1);
    if (!done.has(chapter.id)) {
      done.add(chapter.id);renderProgress();renderCatalog();renderCard();
      announce('這章已記下讀完。你可以休息，或讀下一章。');
    } else {mode='easy';location.hash=`chapter-${chapter.id===14?1:chapter.id+1}`;}
  });
  $('card-body').addEventListener('click',e=>{
    const answer=e.target.closest('[data-answer]');if(answer){stopSpeech();showAnswer(Number(answer.dataset.answer));}
    if(e.target.closest('#hint'))revealHint();
  });
  ['easy','original'].forEach(name=>$(`${name}-tab`).addEventListener('click',()=>setMode(name)));
  document.querySelector('.reader-tabs').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault(); const next=e.key==='Home'?'easy':e.key==='End'?'original':mode==='easy'?'original':'easy';
    setMode(next);$(`${next}-tab`).focus();
  });
  $('bookmark').addEventListener('click',()=>{
    if(bookmarks.has(chapter.id))bookmarks.delete(chapter.id);else bookmarks.add(chapter.id);
    updateBookmark();renderCatalog();persist();announce(bookmarks.has(chapter.id)?'已收藏這一章。':'已取消收藏。');
  });
  $('bookmark-filter').addEventListener('click',()=>{onlyBookmarks=!onlyBookmarks;$('bookmark-filter').setAttribute('aria-pressed',String(onlyBookmarks));renderCatalog();});
  $('chapter-search').addEventListener('input',renderCatalog);
  $('catalog-toggle').addEventListener('click',()=>{const open=$('catalog-body').classList.toggle('open');$('catalog-toggle').setAttribute('aria-expanded',String(open));$('catalog-toggle').textContent=open?'收起目錄':'展開目錄';});
  $('focus-toggle').addEventListener('click',()=>{focusMode=!focusMode;document.body.classList.toggle('focus-mode',focusMode);$('focus-toggle').setAttribute('aria-pressed',String(focusMode));$('focus-toggle').textContent=focusMode?'⊙ 返回完整畫面':'⊙ 專心閱讀';announce(focusMode?'已進入專心閱讀。按返回完整畫面可離開。':'已返回完整畫面。');});
  function pageGo() {
    const value=Number($('source-page').value);
    if(!Number.isInteger(value)||value<chapter.pages[0]||value>chapter.pages[1]) { $('page-help').textContent=`請輸入 ${chapter.pages[0]} 至 ${chapter.pages[1]} 的頁碼。`;announce($('page-help').textContent);return; }
    positions[chapter.id].original=chapter.original.findIndex(c=>c.page===value);
    setMode('original',true);$('page-help').textContent=`已前往原書第 ${value} 頁。`;
  }
  $('page-go').addEventListener('click',pageGo);$('source-page').addEventListener('keydown',e=>{if(e.key==='Enter')pageGo();});
  const openDialog=id=>{stopSpeech();$(id).showModal();if(id==='glossary-dialog'){$('glossary-search').focus();renderAllTerms();}if(id==='settings-dialog')populateVoices();};
  [['settings-open','settings-dialog'],['glossary-open','glossary-dialog'],['about-open','about-dialog'],['footer-about','about-dialog'],['help-open','help-dialog']].forEach(([button,dialog])=>$(button).addEventListener('click',()=>openDialog(dialog)));
  document.querySelectorAll('.dialog-close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
  $('glossary-search').addEventListener('input',renderAllTerms);
  [['font-size','font'],['line-height','line'],['letter-spacing','spacing'],['theme','theme'],['speech-rate','rate'],['voice','voice']].forEach(([id,key])=>{
    $(id).addEventListener('input',()=>{settings[key]=['theme','voice'].includes(key)?$(id).value:Number($(id).value);if(['rate','voice'].includes(key))stopSpeech('語音設定已更新，按聽這一段重新開始。');applySettings();persist();});
  });
  $('settings-reset').addEventListener('click',()=>{settings={...defaults};stopSpeech();applySettings();persist();announce('閱讀設定已還原，閱讀進度保留。');});
  $('speak').addEventListener('click',speak);$('speech-stop').addEventListener('click',()=>stopSpeech('已停止朗讀。'));
  if(speech){populateVoices();speech.addEventListener('voiceschanged',populateVoices);}
  addEventListener('hashchange',()=>readRoute(true));
  addEventListener('pagehide',()=>{if(speech)speech.cancel();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const modal=document.querySelector('dialog[open]');if(modal){e.preventDefault();modal.close();return;}stopSpeech('已停止朗讀。');if(focusMode)$('focus-toggle').click();}});
  applySettings();
  const initialHash=Number(location.hash.match(/^#chapter-(\d+)$/)?.[1]);
  const initialChapter=initialHash>=1&&initialHash<=14?initialHash:Math.floor(clamp(saved.chapter??1,1,14,1));
  chapter=lessons[initialChapter-1];
  history.replaceState(null,'',`#chapter-${chapter.id}`);
  renderChapter();
})();
