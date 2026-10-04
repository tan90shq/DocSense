import os
from sentence_transformers import SentenceTransformer, CrossEncoder
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
 
load_dotenv()
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
reranker=CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")
qdrant_url=os.getenv("QDRANT_URL")
qdrant_api_key=os.getenv("QDRANT_API_KEY")
qdrant_client=QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

if not qdrant_api_key or not qdrant_url:
    raise ValueError("Missing QDRANT_URL or QDRANT_API_KEY environment variables.")


def create_embeddings(chunks: list[dict]):
    emb_chunks=[f"heading : '{chunk['heading']}', content : '{chunk['content']}'" for chunk in chunks]
    vectors = embedding_model.encode(emb_chunks)
    embeddings=vectors.tolist()
    return embeddings


def qdrant_collection_creation(collection_name:str):
    if qdrant_client.collection_exists(collection_name):
        print(f"Deleting existing Collection : {collection_name}")
        qdrant_client.delete_collection(collection_name)

    embedding_size=384
    qdrant_client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=embedding_size,
            distance=Distance.COSINE,
        )
    )
    print(f"Collection created successfully : {collection_name}")


def qdrant_collection_deletion(collection_name:str):
    if qdrant_client.collection_exists(collection_name):
        qdrant_client.delete_collection(collection_name)
        print(f"Collection deleted successfully : {collection_name}")
    else:
        print("An error occured")


def qdrant_collection_upload(collection_name:str, chunks, embeddings):
    points=[]
    id=1
    for no, embedding in enumerate(embeddings):
        point=PointStruct(
            id=id,
            vector=embedding,
            payload=chunks[no]     
        )
        points.append(point)
        id+=1
        
    qdrant_client.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"Successfully appended {len(points)} points")
    return len(points)

