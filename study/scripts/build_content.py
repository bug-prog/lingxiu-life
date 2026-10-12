"""Rebuild source excerpts from the reviewed OCR text; no external services."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'assets/book-part-one.txt'
s=source.read_text(encoding='utf-8-sig')
starts=[44,53,63,74,83,92,102,111,120,127,136,146,155,164,175]
pages={int(p):body.strip() for p,body in re.findall(r'【原書第 (\d+) 頁】\n\n(.*?)(?=\n\n【|\Z)',s,re.S)}
lessons=json.loads((ROOT/'assets/lessons.json').read_text())
for i,lesson in enumerate(lessons):
 a,b=starts[i:i+2]
 lesson['id']=i+1
 lesson['pages']=[a,b-1]
 lesson['original']=[]
 for page in range(a,b):
  for paragraph in pages[page].split('\n\n'):
   # Keep source wording intact; break long paragraphs at sentence boundaries.
   sentences=re.findall(r'.+?[。！？](?:[」』）”])?|.+$',paragraph,re.S)
   if not sentences:sentences=[paragraph]
   chunk=''
   for sentence in sentences:
    if len(chunk)+len(sentence)>180 and chunk:
     lesson['original'].append({'page':page,'text':chunk});chunk=''
    # OCR may contain very long sentences. Split without deleting characters.
    while len(sentence)>240:
     cut=max(sentence.rfind('，',0,180),sentence.rfind('；',0,180))
     if cut<60:cut=179
     if chunk:lesson['original'].append({'page':page,'text':chunk});chunk=''
     lesson['original'].append({'page':page,'text':sentence[:cut+1]})
     sentence=sentence[cut+1:]
    chunk+=sentence
   if chunk:lesson['original'].append({'page':page,'text':chunk})
 # Verify complete original character coverage, including page-spanning sentences.
 expected=''.join(pages[p].replace('\n','') for p in range(a,b))
 actual=''.join(c['text'].replace('\n','') for c in lesson['original'])
 assert expected==actual,lesson['title']
(ROOT/'assets/content.js').write_text('/* Generated locally by scripts/build_content.py. */\nwindow.BOOK_LESSONS = '+json.dumps(lessons,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Built {len(lessons)} chapters; {sum(len(c["original"]) for c in lessons)} original-text cards.')
