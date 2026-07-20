import urllib.request
import os

url_row14 = "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/5/14/28.png"
url_row17 = "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/5/17/28.png"

# Download both
req14 = urllib.request.Request(url_row14, headers={'User-Agent': 'Mozilla/5.0'})
req17 = urllib.request.Request(url_row17, headers={'User-Agent': 'Mozilla/5.0'})

print("Downloading row 14...")
try:
    with urllib.request.urlopen(req14) as resp:
        with open("copernicus_row14.png", "wb") as f:
            f.write(resp.read())
    print("Downloaded row 14.")
except Exception as e:
    print(f"Error row 14: {e}")

print("Downloading row 17...")
try:
    with urllib.request.urlopen(req17) as resp:
        with open("copernicus_row17.png", "wb") as f:
            f.write(resp.read())
    print("Downloaded row 17.")
except Exception as e:
    print(f"Error row 17: {e}")
