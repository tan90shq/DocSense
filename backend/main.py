import json, random
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from schemas import Query, Session
from services.chunking import data_parser, chunk_generator
from services.qdrant import create_embeddings, qdrant_collection_creation,qdrant_collection_deletion, qdrant_collection_upload
from services.retrieval import rerank_chunks, chunk_retrieval, answer_generator, summary_generator, generate_title

def data_loader(file):
    with open(file, "r") as f:
        data = json.load(f)
    return data

def data_paster(data, file):
    #(indent=2, for pretty print)
    with open(file, "w") as f:
        json.dump(data, f, indent=2)
    return data


app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"Message":"This is AI & RAG powered DOC Assistant"}


@app.post("/upload")
def upload_pdf(file: UploadFile=File(...)):
    folder = Path("uploads")
    file_name = file.filename
    allowed_constraints="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-."
    new_file_name=""
    for char in file_name:
        if char not in allowed_constraints:
            char="_"
        new_file_name+=char
    file_name=new_file_name
    file_path=folder / new_file_name
    if file_path.exists():
        raise HTTPException(
            status_code=409,
            detail="file already exists on the server"
        )
    
    with open(file_path,"wb") as fh:
        fh.write(file.file.read())
    print("file upload completed")
    #chunking
    cleaned_data=data_parser(file_path)
    chunks=chunk_generator(cleaned_data, new_file_name)
    print("chunking successful")

    #embedding
    embeddings=create_embeddings(chunks)
    print("embedding successful")

    #qdrant collection creation and uploads
    qdrant_collection_creation(collection_name=new_file_name)
    qdrant_collection_upload(collection_name=new_file_name,chunks=chunks,embeddings=embeddings)

    data=data_loader(r"data\all_pdfs.json")
    data.append(str(new_file_name))
    data_paster(data, r"data\all_pdfs.json")
    print("qdrant collection creation and uploads successful")

    return JSONResponse(
        status_code=200,
        content={"message": "The /UPLOAD endpoint successfully executed.", "file_path": str(file_path)}
    )


@app.delete("/delete/{file_name}")
def delete_pdf(file_name:str):
    folder = Path("uploads")
    file_path= folder / file_name
    data=data_loader(r"data\all_pdfs.json")
    if not file_path.exists() or file_name not in data:
        raise HTTPException(
            status_code=404,
            detail="file not found"
        )
    try:
        file_path.unlink()
        qdrant_collection_deletion(collection_name=file_name)
        data.remove(str(file_name))
        data_paster(data, r"data\all_pdfs.json")
        print("File deleted successfully")
        return {"detail": "File deleted successfully", "file_name": file_name}
        
    except PermissionError:
        raise HTTPException(
            status_code=403,
            detail="Permission denied. Cannot delete this file."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )


@app.post("/session-create")
def session_creation():
    data=data_loader(r"data\all_sessions.json")
    sesion_ids=[session["session_id"] for session in data]
    while True:
        id=random.randint(1, 9999)
        if id not in sesion_ids:
            data.append({"session_id":id,"session_title":"New Chat","previous_chats":[], "chat_summary":""})
            break
    data_paster(data, r"data\all_sessions.json")
    print("session successfully created")
    return {"message": "session successfully created", "session_id": id}



@app.delete("/session-delete/{session_id}")
def session_deletion(session_id:int):
    data=data_loader(r"data\all_sessions.json")

    session_ids=[session["session_id"] for session in data]
    if session_id not in session_ids:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )
    data.pop(session_ids.index(session_id))
    data_paster(data, r"data\all_sessions.json")
    print("session successfully deleted")
    return {"message": "session successfully deleted", "session_id":session_id}


@app.post("/ask")
def chat(user_query:Query, session_id:int):

    user_query=user_query.model_dump()
    all_sessions_data=data_loader(r"data\all_sessions.json")
    all_pdf_data=data_loader(r"data\all_pdfs.json")
    for index,session_data in enumerate(all_sessions_data):
        if session_data["session_id"]==session_id:
            print(index, session_data)
            break
    else:
        raise HTTPException(status_code=404, detail="session not found")

    for file_name in user_query["include_pdf"]:
        if file_name not in all_pdf_data:
            raise HTTPException(
                status_code=404,
                detail="file not found, select valid options from uploaded pdfs")

    if len(session_data["previous_chats"])==0:
        session_data["session_title"]=generate_title(first_query=user_query["query"])
    
    #Retrival
    unique_chunks=[]
    all_relevant_chunks=[]
    for file_name in user_query["include_pdf"]:
        unique_chunks.extend(chunk_retrieval(user_query["query"], collection_name=file_name,chat_summary=session_data["chat_summary"]))

    all_relevant_chunks.extend(rerank_chunks(user_query["query"], unique_chunks))
    print("All relevent chunks successfully retrieved")

    #answer
    chat_summary=session_data["chat_summary"]
    answer=answer_generator(user_query["query"], all_relevant_chunks, chat_summary)

    #session data update
    new_que_ans=[user_query["query"],answer]
    session_data["previous_chats"].append(new_que_ans)
    session_data["chat_summary"]=summary_generator(previous_summary=chat_summary, new_que_ans=new_que_ans)
    
    all_sessions_data[index]=session_data
    print("session updated")
    data_paster(all_sessions_data, r"data\all_sessions.json")

    return answer


@app.get("/pdfs")
def list_pdfs():
    return data_loader(r"data\all_pdfs.json")

@app.get("/sessions")
def list_sessions():
    return data_loader(r"data\all_sessions.json")


@app.get("/session/{session_id}")
def get_session(session_id: int):
    sessions = data_loader(r"data\all_sessions.json")
    for session in sessions:
        if session["session_id"] == session_id:
            return session
    raise HTTPException(status_code=404, detail="Session not found")


@app.get("/pdf/{file_name}")
def get_pdf_file(file_name: str):
    file_path = Path("uploads") / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf")