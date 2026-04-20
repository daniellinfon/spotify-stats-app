"""
Endpoint del agente DJ.

Implementamos streaming para que las respuestas aparezcan
token a token en el frontend (mejor UX que esperar la respuesta completa).
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.core.security import get_current_user
from app.agents.graph.dj_agent import create_dj_agent

router = APIRouter(prefix="/agent", tags=["Agent"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []  # Historial de mensajes anteriores


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Endpoint de chat con el agente DJ.
    Devuelve la respuesta en streaming (Server-Sent Events).
    """
    access_token = current_user["spotify_access_token"]
    agent = create_dj_agent(access_token)

    # Reconstruimos el historial de mensajes
    from langchain_core.messages import AIMessage
    messages = []
    for msg in request.history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=request.message))

    async def generate():
        """Generador que hace streaming de la respuesta token a token."""
        try:
            async for event in agent.astream_events(
                {"messages": messages},
                version="v2",
            ):
                # Solo nos interesan los tokens del LLM, no eventos internos
                if (
                    event["event"] == "on_chat_model_stream"
                    and event["name"] == "ChatGroq"
                ):
                    chunk = event["data"]["chunk"]
                    if chunk.content:
                        yield chunk.content
        except Exception as e:
            yield f"\n[Error del agente: {str(e)}]"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
    )