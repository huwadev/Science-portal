from PIL import Image
import numpy as np
import urllib.request
import os

# Download OPM tile if not exists
if not os.path.exists("opm_copernicus_z5.png"):
    url = "https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/5/14/15.png"
    urllib.request.urlretrieve(url, "opm_copernicus_z5.png")

opm_img = Image.open("opm_copernicus_z5.png").convert("L")
opm_crop = opm_img.crop((0, 0, 128, 128)).resize((256, 256), Image.Resampling.LANCZOS)
opm_arr = np.array(opm_crop, dtype=np.float32)

for name in ["copernicus_row14.png", "copernicus_row17.png"]:
    img = Image.open(name).convert("L")
    arr = np.array(img, dtype=np.float32)
    diff = np.mean(np.abs(opm_arr - arr))
    print(f"{name}: MAE = {diff:.2f}")
