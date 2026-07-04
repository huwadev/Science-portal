# -*- coding: utf-8 -*-
import json
import urllib.request
import urllib.parse
import time
import re
import os
import xml.etree.ElementTree as ET
from xml.dom import minidom

with open('modules/lunar-explorer/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

pois = []
for line in content.split('\n'):
    if "id: '" in line and "wikiTitle: '" in line:
        id_match = re.search(r"id:\s*'([^']+)'", line)
        wiki_match = re.search(r"wikiTitle:\s*'([^']+)'", line)
        if id_match and wiki_match:
            pois.append({'id': id_match.group(1), 'wikiTitle': wiki_match.group(1)})

print(f"Found {len(pois)} POIs with wiki titles.")

results = {}
for poi in pois:
    wiki_id = poi['wikiTitle']
    if wiki_id not in results:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(wiki_id)}"
                req = urllib.request.Request(url, headers={'User-Agent': 'LunarExplorerScript/1.0'})
                response = urllib.request.urlopen(req)
                data = json.loads(response.read())
                
                extract = data.get('extract', '')
                img_url = data.get('thumbnail', {}).get('source', data.get('originalimage', {}).get('source', ''))
                page_url = data.get('content_urls', {}).get('desktop', {}).get('page', '')
                    
                results[wiki_id] = {'extract': extract, 'image': img_url, 'url': page_url}
                print(f"Fetched: {wiki_id}")
                time.sleep(1)
                break
            except urllib.error.HTTPError as e:
                if e.code in [429, 403]:
                    print(f"Rate limited on {wiki_id}, sleeping 5s...")
                    time.sleep(5)
                else:
                    results[wiki_id] = {'extract': '', 'image': '', 'url': ''}
                    break
            except Exception as e:
                results[wiki_id] = {'extract': '', 'image': '', 'url': ''}
                break

root = ET.Element("translations")
for poi in pois:
    poi_el = ET.SubElement(root, "poi", id=poi['id'])
    wiki_data = results.get(poi['wikiTitle'], {'extract': '', 'image': '', 'url': ''})
    
    if wiki_data['image']: poi_el.set('image', wiki_data['image'])
    if wiki_data['url']: poi_el.set('url', wiki_data['url'])
        
    en_el = ET.SubElement(poi_el, "en")
    extract_en = ET.SubElement(en_el, "extract")
    extract_en.text = wiki_data['extract']
    
    am_el = ET.SubElement(poi_el, "am")
    extract_am = ET.SubElement(am_el, "extract")
    
    if poi['id'] == 'apollo11':
        extract_am.text = "አፖሎ 11 (ከጁላይ 16-24 ቀን 1969 ዓ.ም.) የሰው ልጅን ለመጀመሪያ ጊዜ በጨረቃ ላይ ያሳረፈ የአሜሪካ የጠፈር በረራ ነበር። አዛዥ ኒል አርምስትሮንግ እና የጨረቃ ሞዱል አብራሪ በዝ አልድሪን ሐምሌ 20 ቀን 1969 አፖሎ የጨረቃ ሞጁል ንስርን አሳረፉ።"
    elif poi['id'] == 'apollo12':
        extract_am.text = "አፖሎ 12 (ህዳር 14-24 ቀን 1969 ዓ.ም.) በዩናይትድ ስቴትስ አፖሎ ፕሮግራም ስድስተኛው ሰው የተሳፈረበት በረራ እና በጨረቃ ላይ ሁለተኛው ያረፈበት ነበር።"
    elif poi['id'] == 'tycho':
        extract_am.text = "ታይኮ በጨረቃ ደቡባዊ ደጋማ አካባቢዎች የሚገኝ ታዋቂ የጨረቃ ሸለቆ ነው። ስያሜው የተሰጠው ዴንማርካዊው የሥነ ፈለክ ተመራማሪ ታይኮ ብራሄ (1546–1601) ነው።"
    elif poi['id'] == 'mare-imbrium':
        extract_am.text = "ማሬ ኢምብሪየም (የዝናብ ባህር) በጨረቃ ላይ ያለ ሰፊ የላቫ ሜዳ ነው። የጨረቃ ማሪያ የተፈጠሩት ጥንታዊ የእሳተ ገሞራ ፍንዳታዎች በግዙፍ አስትሮይድ ተጽዕኖ የተፈጠሩ ትላልቅ ሸለቆዎችን በላቫ ሲሞሉ ነው።"
    elif poi['id'] == 'oceanus-procellarum':
        extract_am.text = "ኦሽኑስ ፕሮሴላረም (የአውሎ ነፋስ ውቅያኖስ) በጨረቃ ምዕራባዊ ጠርዝ ላይ የሚገኝ ሰፊ የጨረቃ ማሪያ ነው። በጨረቃ ላይ ካሉት ማሪያዎች ሁሉ ትልቁ ነው።"
    else:
        extract_am.text = wiki_data['extract']

xml_str = minidom.parseString(ET.tostring(root, encoding='utf-8')).toprettyxml(indent="  ")
with open('modules/lunar-explorer/translations.xml', 'wb') as f:
    f.write(xml_str if isinstance(xml_str, bytes) else xml_str.encode('utf-8'))
print("translations.xml created successfully.")
