"""Build assets/book.js (書本資料、序言、全書目錄、神論十四章分段) from assets/book-full.txt.
Keeps the author's wording; only splits text into blocks. Run: python3 scripts/build_book.py"""
import difflib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
s=(ROOT/'assets/book-full.txt').read_text(encoding='utf-8-sig')
pages={int(p):re.sub(r'\n*［整理註：[^］]*］\n*','',b).strip() for p,b in re.findall(r'【原書第 (\d+) 頁】\n\n(.*?)(?=\n\n【|\Z)',s,re.S)}
section=lambda name: re.search(r'【'+name+r'】\n\n(.*?)(?=\n\n【)',s,re.S).group(1).strip()
NUM='一二三四五六七八九十'
def cn(n): return NUM[n-1] if n<=10 else ('十'+(NUM[n-11] if n>10 else '')) if n<20 else '二十'+(NUM[n-21] if n>20 else '')
END='。！？」』）)：:；;…—─～!?.'
HEAD=lambda a: len(a)<=18 and not re.search(r'[。，；：！？、「」『』（）()]',a)
# --- 書本資料
head=s.split('============================================================')[0].strip().split('\n\n')
info={'title':'福音神學暨福音難題解答（修訂版）','author':'吳主光','publisher':'種籽出版社','edition':'2016 年 4 月修訂版',
 'isbn':re.search(r'ISBN\s*([\d-]+)',s).group(1),'cover':[l for l in section('封面').split('\n') if l.strip()],
 'copyright':[l for l in section('版權頁').split('\n') if l.strip()],'notes':[p.strip() for p in head[1:] if p.strip()]}
# --- 序言 (pp.1–7)
def blocks_for(prange,skip_title=None):
    out=[];prev_open=False
    for p in prange:
        paras=[x.strip() for x in pages[p].split('\n\n') if x.strip()]
        first=True
        for x in paras:
            if skip_title and x==skip_title: continue
            cont=first and prev_open and not HEAD(x) and not re.match(r'^(\d+\s*[\.．]|（\d+）|答：|問題解答)',x)
            if first: out.append({'t':'pg','n':p,'inline':bool(cont)}); first=False
            out.append({'t':'p','x':x})
        if first: out.append({'t':'pg','n':p,'inline':False})
        prev_open=bool(paras) and paras[-1][-1] not in END and not HEAD(paras[-1])
    return out
pre=blocks_for(range(1,8),skip_title='序言')
for b in pre:
    if b['t']=='p' and re.match(r'^\d+\.\s',b['x']): b['t']='li'
# --- 全書目錄 (pp.8–42)
toc=[];paras=[x.strip() for p in range(8,43) for x in pages[p].split('\n\n') if x.strip()]
for x in paras:
    m=re.match(r'^第([一二三四五六七八九十]+)部\s*(.+)$',x)
    if m: toc.append({'part':len(toc)+1,'name':m.group(2).strip(),'chapters':[]}); continue
    if not toc: continue
    m=re.match(r'^(?:[一二三四五六七八九十]+)?[、，,．.]\s*(.+?)\s*[　 ]*(\d+)$',x)
    if m and not re.match(r'^\d',x): toc[-1]['chapters'].append({'title':m.group(1).strip(),'page':int(m.group(2)),'topics':[],'qaPage':None,'questions':[]}); continue
    ch=toc[-1]['chapters'][-1] if toc[-1]['chapters'] else None
    m=re.match(r'^問題解答\s*[　 ]*(\d+)$',x)
    if m and ch: ch['qaPage']=int(m.group(1)); continue
    m=re.match(r'^(\d+)\s*[\.．]\s*[\.．]?\s*(.+)$',x)
    if m and ch: ch['questions'].append(m.group(2).strip()); continue
    if ch and re.search(r'[□囗]',x): ch['topics']+= [t.strip() for t in re.split(r'\s*[□囗]\s*',x) if t.strip()]; continue
    if x!='目錄': raise SystemExit('unparsed TOC line: '+x)
for part in toc:
    for i,c in enumerate(part['chapters'],1): c['no']=cn(i)
assert [len(p['chapters']) for p in toc]==[14,16,14],[len(p['chapters']) for p in toc]
# --- 三部共四十四章（扉頁 43、175、337 不屬任何章）
PART_END=[175,337,511]
chapters=[];todo=[]
for pi,part in enumerate(toc):
    st=[c['page'] for c in part['chapters']]+[PART_END[pi]]
    todo+=[(pi,tc,st[i],st[i+1]) for i,tc in enumerate(part['chapters'])]
for i,(pi,tc,a,b) in enumerate(todo):
    title=f"{tc['no']}、{tc['title']}"
    raw=blocks_for(range(a,b),skip_title=title)
    out=[];inqa=False;qn=0;heads=[]
    for blk in raw:
        if blk['t']!='p': out.append(blk); continue
        x=blk['x']
        if re.match(r'^問題解答[：:]?$',x): inqa=True; out.append({'t':'qa','id':'qa','x':x}); continue
        m=re.match(r'^(\d+)\s*[\.．]\s*[\.．]?\s*(.+)$',x)
        if inqa and m and int(m.group(1))==qn+1 and not m.group(2).startswith('答'):
            qn+=1; out.append({'t':'q','n':qn,'x':m.group(2).strip(),'id':f'q{qn}'}); continue
        nq=re.sub(r'[\s，。？、：]','',tc['questions'][qn]) if qn<len(tc['questions']) else None
        if inqa and nq and x.endswith('？') and len(x)<90 and difflib.SequenceMatcher(None,re.sub(r'[\s，。？、：]','',x),nq).ratio()>=0.9:
            qn+=1; out.append({'t':'q','n':qn,'x':x,'id':f'q{qn}','restored':True}); continue  # OCR lost the number; text matches 目錄
        if not inqa and HEAD(x): heads.append(x); out.append({'t':'h','x':x,'id':f's{len(heads)}'}); continue
        if inqa and x.startswith('答：'): out.append({'t':'a','x':x[2:].strip()}); continue
        out.append({'t':'p','x':x})
    if qn!=len(tc['questions']): print('NOTE 目錄題數與正文不同:',title,qn,len(tc['questions']),[b2['x'][:20] for b2 in out if b2['t']=='q'],[q[:20] for q in tc['questions']])
    # verify nothing lost
    src=''.join(pages[p].replace('\n','') for p in range(a,b)).replace(title,'',1)
    got=''.join((b2.get('x','') if b2['t']!='q' else (b2['x'] if b2.get('restored') else f"{b2['n']}. {b2['x']}")) if b2['t']!='a' else '答：'+b2['x'] for b2 in out)
    norm=lambda t: re.sub(r'[\s．.]','',t)
    if norm(src)!=norm(got):
        A,B=norm(src),norm(got);k=next(j for j in range(min(len(A),len(B))) if A[j]!=B[j]) if A[:min(len(A),len(B))]!=B[:min(len(A),len(B))] else min(len(A),len(B))
        print(f'TEXTMISMATCH in {title} at {k}: {A[k-20:k+20]!r} vs {B[k-20:k+20]!r}')
    chapters.append({'id':i+1,'part':pi+1,'partName':toc[pi]['name'],'idx':len([c for c in chapters if c['part']==pi+1])+1,'no':tc['no'],'title':tc['title'],'pages':[a,b-1],'qaPage':tc['qaPage'],'sections':heads,'questions':[b2['x'] for b2 in out if b2['t']=='q'] if qn!=len(tc['questions']) else list(tc['questions']),'tocQuestionCount':len(tc['questions']),'blocks':out})
data={'info':info,'preface':pre,'toc':toc,'chapters':chapters}
(ROOT/'assets/book.js').write_text('/* Generated locally by scripts/build_book.py. */\nwindow.BOOK_FULL = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f"Built book: preface {sum(b['t']=='p' or b['t']=='li' for b in pre)} paras; TOC {sum(len(p['chapters']) for p in toc)} chapters in {len(toc)} parts; "
      f"{len(chapters)} chapters, {sum(len(c['sections']) for c in chapters)} subheadings, {sum(len(c['questions']) for c in chapters)} questions.")
for c in chapters: print(c['part'],c['id'],c['title'],'p.',c['pages'],'qa',c['qaPage'],'sections',c['sections'],'Q',len(c['questions']))
