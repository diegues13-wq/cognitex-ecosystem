from PIL import Image
import sys

try:
    img = Image.open("src/assets/cognitex_logo.png")
    print(f"Dimensions: {img.size}")
    print(f"Mode: {img.mode}")
except Exception as e:
    print(e)
