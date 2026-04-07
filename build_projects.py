import os, json, re

result = []
base_dir = "Portfolio_Content"
valid_img_exts = {'.webp', '.jpg', '.jpeg', '.png'}

if os.path.exists(base_dir):
    for p in os.listdir(base_dir):
        p_path = os.path.join(base_dir, p)
        if os.path.isdir(p_path):
            md_file = os.path.join(p_path, "index.md")
            if os.path.exists(md_file):
                # get all images in dir
                images = []
                for f in os.listdir(p_path):
                    if os.path.splitext(f)[1].lower() in valid_img_exts:
                        images.append(f)
                # optionally sort so cover is first, or keep them sorted alphabetically
                images.sort()
                
                with open(md_file, "r") as f:
                    content = f.read()
                # Parse yaml frontmatter
                match = re.search(r"^---\n(.*?)\n---(.*)", content, re.MULTILINE | re.DOTALL)
                if match:
                    yaml_data = match.group(1)
                    body = match.group(2).strip()
                    item = {"slug": p, "body": body, "images": images}
                    for line in yaml_data.split("\n"):
                        if ":" in line:
                            k, v = line.split(":", 1)
                            v = v.split("#")[0] # remove comments
                            v = v.strip().strip("\"'") # remove quotes and spaces
                            item[k.strip()] = v
                    result.append(item)

# Output as Javascript variable
with open("projects.js", "w") as f:
    f.write("const projects = " + json.dumps(result, indent=2) + ";")
print("projects.js generated successfully with images array")
