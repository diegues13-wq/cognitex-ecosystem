from PIL import Image
import numpy as np

def analyze_logo(input_path):
    img = Image.open(input_path).convert("RGB")
    data = np.array(img)
    
    height, width, _ = data.shape
    
    # Calculate "darkness" or "non-whiteness" per row
    # Sum of (255 - pixel_value) for all channels
    # White (255,255,255) => 0
    # Black (0,0,0) => 255*3 = 765
    
    # DEBUG: Check top-left pixel to see what "background" looks like
    bg_sample = data[0, 0, :]
    print(f"Top-Left Pixel RGB: {bg_sample}")

    # Use a softer threshold based on sample or just generic "Light Color"
    # Let's say background is anything with high brightness
    # brightness = avg(R,G,B)
    
    threshold = 200
    
    print(f"--- Detailed Density Scan (Rows 500-800) Brightness > 50 ---")
    
    for y in range(500, 800):
        row = data[y, :, :]
        # Calculate brightness of each pixel
        brightness = np.mean(row, axis=1)
        # Content is Bright pixels (Cyan/White text/icon)
        # Background is Dark/Transparent-Black
        content_pixels = np.sum(brightness > 50)
        
        print(f"Row {y}: {content_pixels} pixels")

    # Heuristic: Find a sequence of rows with LOW density (gap)
    # followed by HIGH density (text)
    # ...

    return []

if __name__ == "__main__":
    segments = analyze_logo("src/assets/cognitex_logo.png")
