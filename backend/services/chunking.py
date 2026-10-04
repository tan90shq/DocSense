import pymupdf

def data_parser(file_path):
    doc = pymupdf.open(file_path)
    cleaned_data= []
    for page_no,page in enumerate(doc):
        data = page.get_text("dict",sort=True)
        for block in data["blocks"]:
            if "lines" not in block:
                continue

            text=""
            for line in block["lines"]:
                span=line["spans"][0]
                line_data={"size":span["size"],"flags":span["flags"], "page":page_no+1}

                for span in line["spans"]:
                    text+=span["text"]+ " "
                
            text+="\n "
            line_data["text"]=text
            cleaned_data.append(line_data)
    return cleaned_data   


def chunk_generator(cleaned_data, file_name):
    if not cleaned_data:
        raise ValueError("The uploaded document contains no extractable text. It may be scanned or empty.")
    avg_size = sum(line_data["size"] for line_data in cleaned_data)/len(cleaned_data)+1
    chunks=[]
    chunk_size=120
    chunk_each={"file_name":file_name,"heading":"","content":"","page":None}
    current_heading = "Introduction"
    for line_data in cleaned_data:

        if line_data["size"]>avg_size or line_data["flags"]!=0:
            if chunk_each["heading"]!="" or chunk_each["content"]!="":
                if chunk_each["heading"]!="" and chunk_each["content"]=="":
                    chunk_each["heading"]+=" [SUBHEADING] : "+ line_data["text"]
                    continue
                else:
                    chunks.append(chunk_each)
            current_heading=line_data["text"]
            chunk_each={"file_name":file_name,"heading":current_heading,"content":"","page":line_data["page"]}
            continue
        else:
            chunk_each["content"]+=line_data["text"]

        if len(chunk_each["content"].split())>chunk_size:
            chunks.append(chunk_each)
            overlap_words=" ".join(chunks[-1]["content"].split()[-30:])
            chunk_each={"file_name":file_name,"heading":current_heading,"content":overlap_words,"page":line_data["page"]}

    chunks.append(chunk_each)
    return chunks