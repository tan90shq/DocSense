import os, json
from groq import Groq
from dotenv import load_dotenv
from schemas import Query_Enhancer, Answer
from services.qdrant import embedding_model,reranker, qdrant_client
print()
load_dotenv()
groq_api_key=os.getenv("GROQ_API_KEY")
groq_client=Groq(api_key=groq_api_key)
groq_model="openai/gpt-oss-120b"

if not groq_api_key:
    raise ValueError("env fetch error")

def query_enhancer(user_query:str, chat_summary):
    prompt = f"""
You are a query expansion module for a document RAG system.

CONVERSATION SUMMARY:
{chat_summary}

ORIGINAL USER QUERY:
{user_query}

Your task is to generate 4 search queries that retrieve relevant passages
from a private knowledge base.

IMPORTANT:
The user query may be a follow-up question that is incomplete by itself.
Use the conversation summary to understand what the user is referring to.

For example:
- "tell me more"
- "explain that"
- "can you elaborate?"
- "what about its architecture?"
- "give me more details"

For such queries, resolve the missing context from the conversation summary
before generating search queries.

Requirements:
1. Preserve the user's original intent.
2. Use the conversation summary only to resolve references and missing context.
3. Do NOT invent facts.
4. Make every query meaningfully different.
5. Include useful keywords and terminology from the conversation context.
6. One query should stay close to the resolved user query.
7. One should be keyword-rich.
8. One should use alternative wording/synonyms.
9. One should focus on the specific information likely needed to answer the question.
10. Do not make the queries unnecessarily long.
11. If the user query is casual conversation, a greeting, or small talk,
    do not force it into a document-search interpretation.
12. Prefer explicit entities, topics, names, and concepts from the conversation
    when resolving follow-up questions.
13. Never introduce facts that are not present in the user query or conversation summary.

Important:
STRICTLY Return ONLY the JSON structure requested by the schema: {Query_Enhancer}
"""

    message={
        "role":"user",
        "content":prompt,
    }
    messages=[message]
    response= groq_client.chat.completions.create(model=groq_model, messages=messages, response_format={"type": "json_object"})
    content=response.choices[0].message.content
    enhanced_queries=json.loads(content)

    if user_query not in enhanced_queries["queries"]:
        enhanced_queries["queries"].insert(0, user_query)

    validated_enhanced_query = Query_Enhancer.model_validate(enhanced_queries)
    print("query enhanced")
    return validated_enhanced_query.model_dump()

#print(query_enhancer("how to reset the password of admin panel"))


def retrieve_for_query(query: str, collection_name):
    results = qdrant_client.query_points(
        collection_name=collection_name,
        query=embedding_model.encode(query).tolist(),
        limit=8,
        with_payload=True
    ).points
    print("a single retrival is done")
    return results


def multi_query_retrieval(enhanced_queries, collection_name):
    unique_chunks = []

    for query in enhanced_queries["queries"]:
        results = retrieve_for_query(query,collection_name)
        for point in results:
            if point.payload not in unique_chunks:
                unique_chunks.append(point.payload)
    print("all retrivals are done")
    return unique_chunks


def chunk_retrieval(user_query, collection_name,chat_summary):
    attempt=1
    while attempt<=5:
        try:
            enhanced_queries=query_enhancer(user_query,chat_summary)
            break
        except Exception as e:
            attempt+=1
            print(f"Query enhancement attempt {attempt} failed: {e}")
    if enhanced_queries is None:
        raise RuntimeError("Failed to generate valid search queries")
    
    unique_chunks=multi_query_retrieval(enhanced_queries, collection_name)
    return unique_chunks


def rerank_chunks(user_query, unique_chunks, top_k=5):
    documents=[f"heading : '{chunk['heading']}', content : '{chunk['content']}'" for chunk in unique_chunks]

    results = reranker.rank(user_query, documents, top_k=top_k)
    reranked_chunks=[unique_chunks[result["corpus_id"]] for result in results]
    print("reranked the chunks successfully")
    return reranked_chunks


def answer_generator(user_query, all_relevant_chunks, chat_summary):
    context = ""

    for chunk in all_relevant_chunks:
        context += f"""
PDF: {chunk.get('file_name', 'Unknown')}
Page: {chunk.get('page', 'Unknown')}
Heading: {chunk.get('heading', '').strip()}
Content: {chunk.get('content', '').strip()}

"""
    prompt = f"""
You are the answer-generation module of a document question-answering system.

Your job is to produce the final response to the user's message using the
retrieved document context, while using the conversation summary to understand
references, follow-up questions, and conversational context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{chat_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{user_query}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETRIEVED DOCUMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Answer the user's message directly, accurately, and naturally.
2. Use the retrieved document context as the primary factual source for
   document-related questions.
3. Use the conversation summary to understand:
   - follow-up questions
   - references such as "it", "that", "this", "they", "the company", etc.
   - requests such as "tell me more", "explain that", "elaborate", "continue",
     "why?", "how?", or "give me more details"
   - the subject of the previous discussion
4. Do NOT treat every user message as an independent question.
   A short or incomplete question may depend on previous conversation context.
5. When a follow-up question is ambiguous by itself, resolve the missing
   subject using the conversation summary before interpreting the question.
6. Do not invent, assume, or hallucinate facts.
7. Do not use general world knowledge to fill gaps in retrieved document
   evidence unless the user explicitly asks for information beyond the
   documents.
8. The conversation summary is for conversational understanding.
   It is NOT a replacement for retrieved document evidence when making
   factual claims about the knowledge base.
9. If multiple retrieved passages are relevant, combine them into one coherent
   answer.
10. Prefer specific, explicit evidence over vague or indirect evidence.
11. If the retrieved context is insufficient to answer a factual document-based
    question, clearly say that the available documents do not provide enough
    information.
12. Never pretend that information exists in the documents when it does not.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CASUAL CONVERSATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. If the user is only greeting, saying goodbye, thanking you, or making
    ordinary small talk, respond naturally.
14. Casual conversation does not require document evidence.
15. For casual conversation, return an empty citations list.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKDOWN ANSWER FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. The value of the "answer" field MUST be a Markdown-formatted string.
17. Use Markdown to make the response clear, readable, and visually structured.
18. You may use, when appropriate:
    - # / ## / ### headings
    - **bold**
    - *italic*
    - bullet lists
    - numbered lists
    - Markdown tables
    - inline `code`
    - fenced code blocks when code is relevant
    - blockquotes when useful
19. Choose formatting based on the complexity of the answer.
    Do NOT force headings, tables, or lists when a simple paragraph is better.
20. For simple answers, keep the response simple.
    For detailed explanations, use clear sections and structured formatting.
21. Prefer this general structure for complex answers:
    ## Main Topic
    Direct explanation.
    ### Key Points
    - Important point
    - Important point
    ### Details
    More explanation.
    Use tables when comparing multiple structured items.
22. Do not use Markdown merely for decoration.
    Formatting must improve readability.
23. Markdown MUST remain inside the JSON "answer" string.
    Never output Markdown outside the JSON object.
24. Do not place citations inside the Markdown answer unless they are part of
    the exact source text itself. All document citations belong in the
    "citations" array.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CITATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
25. Every factual claim derived from the retrieved document context must have
    a corresponding citation in the "citations" array.
26. Each citation MUST contain exactly:
    - "source_text": exact supporting text from the retrieved context
    - "file_name": exact file name from the retrieved context
    - "page": exact page number from the retrieved context
27. "source_text" must be copied exactly from the retrieved context.
    Do not rewrite, summarize, or fabricate it.
28. Never fabricate:
    - source_text
    - file_name
    - page number
29. Only cite information that actually appears in the retrieved context.
30. If multiple sources support the answer, include all relevant citations.
31. If the answer cannot be supported by the retrieved document context,
    return an empty citations list.
32. For greetings and casual conversation, return an empty citations list.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
33. Return ONLY the JSON object required by the schema.
34. Do NOT return:
    - Markdown outside the JSON
    - code fences
    - explanations before or after the JSON
    - comments
    - additional keys
    - additional fields
35. The JSON structure MUST exactly match the provided schema.
36. The "answer" value must remain a valid JSON string even when it contains
    Markdown.
37. Do not change, rename, remove, or add fields to the schema.
38. Ensure that quotes, backslashes, and newlines inside the Markdown answer
    are properly escaped so the final response remains valid JSON.
39. Before returning the response, internally verify:
    - valid JSON
    - exact schema structure
    - Markdown is only inside "answer"
    - citations contain only supported evidence
    - no fabricated citation data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT OUTPUT FORMAT / SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{Answer}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
    "answer": "## Nimbus Forge\\n\\n**Nimbus Forge Technologies Pvt. Ltd.** is the company behind the **Aster** event-driven workflow platform.\\n\\n### Key Information\\n\\n| Item | Details |\\n|---|---|\\n| Company | Nimbus Forge Technologies Pvt. Ltd. |\\n| Platform | **Aster** |",
    "citations": [
        {{
            "source_text": "Nimbus Forge Technologies Pvt. Ltd. is the company behind the Aster event-driven workflow platform.",
            "file_name": "Nimbus_Internal_Knowledge_Base.pdf",
            "page": 1
        }}
    ]
}}
"""
    message={
            "role":"user",
            "content":prompt,
        }
    messages=[message]
    response= groq_client.chat.completions.create(model=groq_model, messages=messages, response_format={"type": "json_object"})
    content=response.choices[0].message.content.strip()
    answer=json.loads(content)
    validated_answer = Answer.model_validate(answer)
    print("answer generated successfully")
    return validated_answer.model_dump()


def summary_generator(previous_summary:str, new_que_ans:list[str]):
    prompt = f"""
You are a chat history summarizer.

Your job is to maintain a concise running summary of a conversation that will
be used to understand future user messages.

PREVIOUS SUMMARY:
{previous_summary}

NEW CONVERSATION:
USER : {new_que_ans[0]}
ASSISTANT : {new_que_ans[1]}

Instructions:
- Update the previous summary using the new conversation.
- Preserve important context, facts, decisions, user preferences, and unresolved
  questions.
- Preserve the main topic and the current subject being discussed.
- Preserve important named entities, documents, companies, products, people,
  concepts, and relationships mentioned in the conversation.
- Preserve what the user's most recent substantive question was about.
- Preserve enough context to resolve follow-up messages such as:
  "tell me more", "explain that", "what about it?", "why?", "how?", "continue",
  or "give me a detailed explanation".
- Remove repetition, greetings, small talk, and irrelevant details.
- Do not invent information.
- Keep the summary concise but useful for understanding future messages.
- Write the result as plain text.
- Do not use JSON, markdown headings, or explanations.
- Return ONLY the updated summary.

Updated summary:
"""

    message={
        "role":"user",
        "content":prompt,
    }
    messages=[message]
    response= groq_client.chat.completions.create(model=groq_model, messages=messages)
    chat_summary=response.choices[0].message.content.strip()
    print("summary generated successfully")
    return chat_summary


def generate_title(first_query: str):

    prompt = f"Generate a 5-6 word concise title for this query. Return ONLY the title: {first_query}"
    model = "openai/gpt-oss-20b"
    message = {"role": "user", "content": prompt}
    response = groq_client.chat.completions.create(model=model, messages=[message])
    content = response.choices[0].message.content.strip()
    print("title generated successfully")
    return content