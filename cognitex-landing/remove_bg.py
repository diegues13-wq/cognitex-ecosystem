from PIL import Image
import sys

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # If the pixel is black (or very close to valid black), make it transparent
        # Threshold: RGB values < 50
        if item[0] < 50 and item[1] < 50 and item[2] < 50:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
    else:
        remove_black_background(sys.argv[1], sys.argv[2])
