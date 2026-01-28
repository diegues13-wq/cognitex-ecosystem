from PIL import Image
import numpy as np

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)

    # 1. CROP: Remove the bottom part Aggressively.
    # Text "COGNITEX" was still visible. 
    # Keep top 600 pixels (approx 58%).
    cropped_data = data[0:600, :] 
    img_cropped = Image.fromarray(cropped_data)

    # 2. BACKGROUND REMOVAL
    # Convert back to numpy to check colors
    data_cropped = np.array(img_cropped)
    
    # Define what is "background". 
    # The user complained about "white" and "checkerboard" (gray/white).
    # We'll treat anything close to white or specific gray levels as transparent.
    
    red, green, blue, alpha = data_cropped.T
    
    # Replace white-ish areas with transparent
    # Condition: R>200 and G>200 and B>200 (Light colors)
    white_areas = (red > 200) & (green > 200) & (blue > 200)
    data_cropped[..., 3][white_areas.T] = 0

    # Also handle the "gray checkerboard" if it exists in the pixels (e.g. RGB ~ 204 or 255)
    # Let's be aggressive with transparency for typical background colors
    
    final_img = Image.fromarray(data_cropped)
    
    # 3. TRIM transparency
    # Get bounding box of non-transparent content to tighten the icon
    bbox = final_img.getbbox()
    if bbox:
        final_img = final_img.crop(bbox)

    final_img.save(output_path, "PNG")
    print(f"Processed logo saved to {output_path}")

if __name__ == "__main__":
    process_logo("src/assets/cognitex_icon.png", "src/assets/cognitex_icon.png")
