from pydantic import BaseModel, Field
from typing import Annotated, List ,Literal


class Query(BaseModel):
    query: Annotated[str, Field(..., description="basic query of user.")]
    include_pdf: Annotated[List[str], Field(..., description="file paths of pdfs you want to involve.", examples=[["doc1.pdf","doc2.pdf"]])]

class Session(BaseModel):
    session_id: Annotated[int, Field(..., description="Session ID of that session")]
    session_title: Annotated[str, Field(..., description="Session Title of that session")]
    previous_chats:Annotated[List[List[str]], Field(..., description="all questions and answers")]
    chat_summary: Annotated[str, Field(..., description="summary of previous chats (que+ans ~ 200-300words)")]


class Query_Enhancer(BaseModel):
    queries: List[str]


class Citation(BaseModel):
    source_text: str
    file_name: str
    page: int 


class Answer(BaseModel):
    answer: str
    citations: list[Citation]  