import csv,json,re,sys,collections
sys.stdout.reconfigure(encoding='utf-8')
S=sys.argv[1]
key=lambda t:int(t.split('-')[1])
cnt=lambda f: collections.Counter(open(f'{S}/{f}',encoding='utf-8').read().split())
tree,log,c133,cov=cnt('refs-tree.txt'),cnt('refs-log.txt'),cnt('refs-133.txt'),cnt('refs-covers.txt')
allt=sorted(set(tree)|set(log),key=key)
story={}
for r in csv.DictReader(open('docs/shared/story_src.csv',encoding='utf-8-sig')):
    for t in re.findall(r'SCRUM-\d+',r['scrum']): story.setdefault(t,[]).append(r['id'])
jira={}
rows=list(csv.reader(open('docs/shared/Jira.csv',encoding='utf-8-sig'))); h=rows[0]
ik,isum,ist=h.index('Issue key'),h.index('Summary'),h.index('Status')
for r in rows[1:]: jira[r[ik]]=(r[isum],r[ist])
prs=json.load(open(f'{S}/prs.json',encoding='utf-8'))
t2p=collections.defaultdict(list); pst={}
for p in prs:
    for t in set(re.findall(r'SCRUM-\d+',p['title'])):
        t2p[t].append(p['number']); pst[p['number']]=p
    for s in re.findall(r'\b([A-K]\d{1,2})\b',p['title'].split('(')[-1]):
        pass
out=[]
for t in allt:
    ps=sorted(t2p.get(t,[]))
    pstr=','.join(f"#{n}{'' if pst[n]['state']=='MERGED' else '('+pst[n]['state'].lower()+')'}" for n in ps)
    # story from PR title parenthetical if not in csv
    st=story.get(t)
    src='csv'
    if not st and ps:
        m=re.search(r'\(([^()]*)\)\s*$',pst[ps[0]]['title'])
        ids=re.findall(r'\b[A-K]\d{1,2}\b',m.group(1)) if m else []
        st=ids or None; src='pr-title'
    j=jira.get(t,('NOT IN JIRA EXPORT',''))
    out.append((t,tree[t],c133[t],cov[t],log[t],'/'.join(st) if st else '-',src if st else '',pstr or '-',j[1],j[0][:70]))
print('ticket tree in133 covers log story src prs status title')
for o in out: print(*o,sep='\t')
print('\nTOTAL',len(out),'no-PR',sum(1 for o in out if o[7]=='-'),'no-story',[o[0] for o in out if o[5]=='-'],'multi-story',[o[0]+'='+o[5] for o in out if '/' in o[5]],'multi-PR',[o[0]+'='+o[7] for o in out if ',' in o[7]])
