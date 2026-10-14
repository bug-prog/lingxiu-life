"""Rebuild source excerpts from the reviewed OCR text; no external services."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'assets/book-full.txt'
s=source.read_text(encoding='utf-8-sig')
BOOK=json.loads((ROOT/'assets/book.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
pages={int(p):re.sub(r'\n*［整理註：[^］]*］\n*','',body).strip() for p,body in re.findall(r'【原書第 (\d+) 頁】\n\n(.*?)(?=\n\n【|\Z)',s,re.S)}
END='。！？」』）”：'
def merge(pieces):
 # Regroup tiny cards without changing words: a short piece joins its neighbour on the
 # same page (headings join the paragraph after them; short tails join the card before),
 # and a short remnant that finishes a sentence carried over a page break joins the
 # previous card. Paragraph breaks are kept as blank lines inside the card.
 out=[]
 for pc in pieces:
  if out:
   cur=out[-1];sep='\n\n' if pc['para'] else ''
   same=cur['page']==pc['page']
   small=len(cur['text'])<70 or len(pc['text'])<50
   carry=(not same) and len(pc['text'])<50 and cur['text'][-1] not in END
   if (same and small and len(cur['text'])+len(pc['text'])<=300) or carry:
    cur['text']+=('' if carry else sep)+pc['text'];continue
  out.append({'page':pc['page'],'text':pc['text']})
 return out
lessons=json.loads((ROOT/'assets/lessons.json').read_text())
# 第二、三部未有淺白導讀：只建立原文卡（originalOnly）
for c in BOOK['chapters'][len(lessons):]:
 lessons.append({'title':c['title'],'short':f"第{'一二三'[c['part']-1]}部 · {c['partName']}",'group':'','icon':'','terms':[],'cards':None,'quiz':None,'originalOnly':True})
for i,lesson in enumerate(lessons):
 bc=BOOK['chapters'][i];a,b=bc['pages'][0],bc['pages'][1]+1
 lesson['part']=bc['part'];lesson['partName']=bc['partName'];lesson['no']=bc['no'];lesson['idx']=bc['idx']
 lesson['id']=i+1
 lesson['pages']=[a,b-1]
 lesson['original']=[];pieces=[];newpara=[True]
 def emit(page,text):
  pieces.append({'page':page,'text':text,'para':newpara[0]});newpara[0]=False
 for page in range(a,b):
  for paragraph in pages[page].split('\n\n'):
   newpara[0]=True
   # Keep source wording intact; break long paragraphs at sentence boundaries.
   sentences=re.findall(r'.+?[。！？](?:[」』）”])?|.+$',paragraph,re.S)
   if not sentences:sentences=[paragraph]
   chunk=''
   for sentence in sentences:
    if len(chunk)+len(sentence)>180 and chunk:
     emit(page,chunk);chunk=''
    # OCR may contain very long sentences. Split without deleting characters.
    while len(sentence)>240:
     cut=max(sentence.rfind('，',0,180),sentence.rfind('；',0,180))
     if cut<60:cut=179
     if chunk:emit(page,chunk);chunk=''
     emit(page,sentence[:cut+1])
     sentence=sentence[cut+1:]
    chunk+=sentence
   if chunk:emit(page,chunk)
 lesson['original']=merge(pieces)
 # Verify complete original character coverage, including page-spanning sentences.
 expected=''.join(pages[p].replace('\n','') for p in range(a,b))
 actual=''.join(c['text'].replace('\n','') for c in lesson['original'])
 assert expected==actual,lesson['title']
(ROOT/'assets/content.js').write_text('/* Generated locally by scripts/build_content.py. */\nwindow.BOOK_LESSONS = '+json.dumps(lessons,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Built {len(lessons)} chapters; {sum(len(c["original"]) for c in lessons)} original-text cards.')
