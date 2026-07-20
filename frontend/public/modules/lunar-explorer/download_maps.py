import urllib.request
import os

print("Downloading maps...")

req = urllib.request.Request(
    'https://upload.wikimedia.org/wikipedia/commons/d/db/Moonmap_from_clementine_data.png',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)
with urllib.request.urlopen(req) as response, open('d:\\Documents\\ESSS Science\\modules\\lunar-explorer\\moon_color.png', 'wb') as out_file:
    data = response.read()
    out_file.write(data)
print("Color map downloaded.")

req2 = urllib.request.Request(
    'https://upload.wikimedia.org/wikipedia/commons/f/f0/Moon_topography_map.png',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)
with urllib.request.urlopen(req2) as response, open('d:\\Documents\\ESSS Science\\modules\\lunar-explorer\\moon_bump.png', 'wb') as out_file:
    data = response.read()
    out_file.write(data)
print("Bump map downloaded.")
