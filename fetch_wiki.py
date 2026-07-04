import json
import urllib.request
import time
import re

# Parse data.js to get wiki titles
with open('modules/lunar-explorer/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract POIs
pois = []
for line in content.split('\n'):
    if "id: '" in line and "wikiTitle: '" in line:
        id_match = re.search(r"id:\s*'([^']+)'", line)
        wiki_match = re.search(r"wikiTitle:\s*'([^']+)'", line)
        if id_match and wiki_match:
            pois.append({
                'id': id_match.group(1),
                'wikiTitle': wiki_match.group(1)
            })

print(f"Found {len(pois)} POIs with wiki titles.")

results = {}
for poi in pois:
    wiki_id = poi['wikiTitle']
    if wiki_id not in results:
        try:
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(wiki_id)}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            data = json.loads(response.read())
            extract = data.get('extract_html', data.get('extract', ''))
            results[wiki_id] = extract
            print(f"Fetched: {wiki_id}")
        except Exception as e:
            print(f"Failed to fetch {wiki_id}: {e}")
            results[wiki_id] = ""
        time.sleep(0.1)

with open('wiki_extracts.json', 'w', encoding='utf-8') as f:
    json.dump({'pois': pois, 'extracts': results}, f, indent=2, ensure_ascii=False)
