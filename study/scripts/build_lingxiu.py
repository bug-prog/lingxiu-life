"""Build 《靈修生活》 data from assets/lingxiu-source.txt (OCR text, no page numbers).
Outputs assets/lingxiu-book.js (目錄與原文) and assets/lingxiu-content.js (陪伴閱讀: 導讀 + 原文卡).
Only conservative OCR fixes (listed below) and paragraph re-joining; wording otherwise kept.
Run: python3 scripts/build_lingxiu.py"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
raw=(ROOT/'assets/lingxiu-source.txt').read_text(encoding='utf-8-sig')
# 明顯 OCR 錯字（只改不會有歧義的字形誤認）
FIX=[('坊其麼','為甚麼'),('坊甚麼','為甚麼'),('基麼是','甚麼是'),('中交','中文'),('經交','經文'),('經女','經文'),('原交','原文'),('原女','原文'),
 ('上女','上文'),('前女','前文'),('交化','文化'),('交字','文字'),('交法','文法'),('中英交','中英文'),('中英女','中英文'),('英女','英文'),
 ('自已','自己'),('四十書夜','四十晝夜'),('耶鱗','耶穌'),('禧告','禱告'),('推黃','推廣'),('每外神學院','海外神學院'),('相當長好','相當良好'),
 ('作著的','作者的'),('隆落','墮落'),('下疵','瑕疵'),('啟蕩','放蕩'),('主稿婦','主禱文'),('主禧女','主禱文'),('比學識要，','比學識重要，')]
for a,b in FIX: raw=raw.replace(a,b)
lines=[l.strip() for l in raw.split('\n')]
END='。！？」』）)”：:；;…—～!?'
JUNK={'5','，回','二一','日期五'}
def is_head(x): return 2<=len(x)<=16 and not re.search(r'[。，；：！？、:,]',x) and x not in JUNK and not re.fullmatch(r'[\d\W]+',x)
# 大綱
units=[];cur=None;table=None
TOPS=re.compile(r'^(序言|第([一二三四五六七八九十]+)章\s*(.+)|附篇([一二三四])\s*(.+))$')
for i,x in enumerate(lines):
    if i<2 or not x: continue
    m=TOPS.match(x.replace('　',' '))
    if m and len(x)<24:
        if m.group(1)=='序言': cur={'key':'pre','no':'序言','title':'序言','blocks':[]}
        elif m.group(2): cur={'key':'ch'+str('一二三四五六七八九十'.index(m.group(2))+1),'no':f'第{m.group(2)}章','title':m.group(3).strip(),'blocks':[]}
        else: cur={'key':'ap'+str('一二三四'.index(m.group(4))+1),'no':f'附篇{m.group(4)}','title':m.group(5).strip(),'blocks':[]}
        units.append(cur); continue
    if x in JUNK: continue
    # 第五章「靈修測表」的表格：OCR 只剩一列列短詞，合成一段表格摘要
    if 430<=i+1<=493:
        if table is None: table={'t':'table','x':[]}; cur['blocks'].append(table)
        table['x'].append(x); continue
    if x=='的境界。' and cur['blocks'] and cur['blocks'][-1]['t']=='h': # 標題後殘句，接回標題前一段
        prev=[b for b in cur['blocks'] if b['t']=='p'][-1]; prev['x']+=x; continue
    if is_head(x) and cur['key']!='pre': cur['blocks'].append({'t':'h','x':x}); continue
    bl=cur['blocks']
    if bl and bl[-1]['t']=='p' and bl[-1]['x'][-1] not in END: bl[-1]['x']+=x; continue  # 斷行接回
    bl.append({'t':'p','x':x})
for u in units:
    for b in u['blocks']:
        if b['t']=='table': b['t']='p'; b['x']='（原書此處為「靈修測表」表格，掃描後只餘欄目：'+'、'.join(b['x'])+'）'
    u['sections']=[b['x'] for b in u['blocks'] if b['t']=='h']
    n=0
    for b in u['blocks']:
        if b['t']=='h': n+=1; b['id']=f's{n}'
lessons=json.loads((ROOT/'assets/lingxiu-lessons.json').read_text(encoding='utf-8'))
byKey={u['key']:u for u in units}
assert set(byKey)==set(l['key'] for l in lessons['lessons']),(set(byKey)^set(l['key'] for l in lessons['lessons']))
LEVELS=lessons['levels']
# 原文卡
def cards(u):
    pieces=[];sec=u['no']
    for b in u['blocks']:
        if b['t']=='h': sec=b['x']; pieces.append({'sec':sec,'text':b['x'],'para':True,'head':True}); continue
        sents=re.findall(r'.+?[。！？](?:[」』）”])?|.+$',b['x'],re.S) or [b['x']]
        chunk='';first=True
        for s in sents:
            while len(s)>240:
                c=max(s.rfind('，',0,180),s.rfind('；',0,180)); c=179 if c<60 else c
                if chunk: pieces.append({'sec':sec,'text':chunk,'para':first}); chunk=''; first=False
                pieces.append({'sec':sec,'text':s[:c+1],'para':first}); first=False; s=s[c+1:]
            if len(chunk)+len(s)>180 and chunk: pieces.append({'sec':sec,'text':chunk,'para':first}); chunk=''; first=False
            chunk+=s
        if chunk: pieces.append({'sec':sec,'text':chunk,'para':first})
    out=[]
    for p in pieces:
        if out:
            c=out[-1]
            if c.get('headonly') or ((len(c['text'])<70 or len(p['text'])<50) and len(c['text'])+len(p['text'])<=300 and not p.get('head')):
                c['text']+=('\n\n' if p['para'] else '')+p['text']; c.pop('headonly',None); continue
        out.append({'sec':p['sec'],'text':p['text'],**({'headonly':True} if p.get('head') else {})})
    for c in out: c.pop('headonly',None)
    exp=''.join(b['x'] for b in u['blocks']); got=''.join(c['text'].replace('\n','') for c in out)
    assert exp==got,u['key']
    return [{'label':f"{u['no']} · {c['sec']}" if c['sec']!=u['no'] else u['no'],'text':c['text']} for c in out]
L=[]
for i,l in enumerate(lessons['lessons'],1):
    u=byKey[l['key']]; lv=next(k for k,v in enumerate(LEVELS) if l['key'] in v['keys'])
    L.append({**{k:v for k,v in l.items() if k!='key'},'key':l['key'],'id':i,'no':u['no'],'title':l.get('title') or u['title'],'bookTitle':u['title'],
      'part':lv+1,'partName':LEVELS[lv]['name'],'partTitle':f"第{'一二三四'[lv]}站　{LEVELS[lv]['name']}",'idx':sum(1 for x in L if x['part']==lv+1)+1,'original':cards(u)})
conf={'storage':'slow-reader:lingxiu:v1','book':'靈修生活','noPages':True,'glossary':lessons['glossary']}
(ROOT/'assets/lingxiu-content.js').write_text('/* Generated by scripts/build_lingxiu.py. */\nwindow.STUDY_CONF='+json.dumps(conf,ensure_ascii=False)+';\nwindow.BOOK_LESSONS='+json.dumps(L,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
order={l['key']:l['id'] for l in L}
book={'title':'靈修生活','author':'吳主光','date':'一九七七年十月（序言署期）','levels':[{'name':v['name'],'desc':v['desc'],'keys':v['keys']} for v in LEVELS],
 'units':[{'key':u['key'],'no':u['no'],'title':u['title'],'guide':order[u['key']],'sections':u['sections'],'blocks':u['blocks']} for u in units]}
(ROOT/'assets/lingxiu-book.js').write_text('/* Generated by scripts/build_lingxiu.py. */\nwindow.LINGXIU_BOOK='+json.dumps(book,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f"units {len(units)}: "+'; '.join(f"{u['no']}{u['title']} 小標題{len(u['sections'])} 段{sum(b['t']=='p' for b in u['blocks'])}" for u in units))
print('sections',sum(len(u['sections']) for u in units),'cards',sum(len(l['original']) for l in L),'chars',sum(len(b['x']) for u in units for b in u['blocks']))
