import os


def process_files(melee_path, stylesheet_path, output_path):
    # Read the contents of melee.html
    with open(melee_path, 'r') as melee_file:
        melee_content = melee_file.readlines()
    
    # Read the contents of stylesheet.html
    with open(stylesheet_path, 'r') as stylesheet_file:
        stylesheet_content = stylesheet_file.readlines()
    
    # Filter out lines starting with '@import' from stylesheet content
    filtered_stylesheet_content = [line for line in stylesheet_content if not line.strip().startswith('@import')]
    
    # Join the filtered stylesheet content into a single string
    filtered_stylesheet_content_str = ''.join(filtered_stylesheet_content)
    
    # Prepare the output content by replacing the specific line
    output_content = []
    for line in melee_content:
        if "<?!= HtmlService.createHtmlOutputFromFile('stylesheet.html').getContent(); ?>" in line:
            output_content.append(filtered_stylesheet_content_str)
        else:
            output_content.append(line)
    
    # Add the HTML footprint
    html_footprint = "\n<!-- all rights reserved to \"@malys\" -->\n"
    output_content.append(html_footprint)
    
    # Write the output content to melee-standalone.html
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as output_file:
        output_file.writelines(output_content)

# Define file paths
base_path="src/"
melee_path = base_path+'melee.html'
stylesheet_path =base_path+ 'stylesheet.html'
output_path = 'dist/index.html'

# Process the files
process_files(melee_path, stylesheet_path, output_path)

print(f'File {output_path} has been created successfully.')
