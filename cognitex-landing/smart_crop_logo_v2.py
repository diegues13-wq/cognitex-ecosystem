from PIL import Image
import numpy as np

def smart_crop(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # 1. CROP at Row 680 (Based on Density Scan)
    # Icon ends ~650. Text starts 689.
    # 680 is the safe zone.
    width, height = img.size
    img_cropped = img.crop((0, 0, width, 680))
    
    # 2. BACKGROUND REMOVAL
    data = np.array(img_cropped)
    red, green, blue, alpha = data.T
    
    # User complained about White background.
    # Identify White/Light pixels
    # Condition: R>200 & G>200 & B>200
    white_areas = (red > 200) & (green > 200) & (blue > 200)
    
    # Set Alpha to 0 for these areas
    data[..., 3][white_areas.T] = 0
    
    # 3. TRIM (Auto-crop transparent areas)
    final_img = Image.fromarray(data)
    bbox = final_img.getbbox()
    if bbox:
        final_img = final_img.crop(bbox)
        
    final_img.save(output_path, "PNG")
    print(f"Saved optimized logo to {output_path}")

if __name__ == "__main__":
    smart_crop("src/assets/cognitex_logo.png", "src/assets/cognitex_icon.png")
