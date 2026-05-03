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
        try:
            final_response = ""
            async for chunk in agent.astream(
                {"messages": messages, "tool_result": "", "iterations": 0}
            ):
                if "agent" in chunk:
                    for msg in chunk["agent"].get("messages", []):
                        if hasattr(msg, "content") and msg.content:
                            # Solo mostramos mensajes que NO sean tool calls
                            if "TOOL:" not in msg.content:
                                final_response = msg.content
            yield final_response
        except Exception as e:
            yield f"\n[Error: {str(e)}]"
            
    return StreamingResponse(
        generate(),
        media_type="text/plain",
    )