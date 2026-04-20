"""
Grafo LangGraph del agente DJ.

Arquitectura del grafo:
    START → agent → (si hay tool calls) → tools → agent → ... → END

El nodo 'agent' decide si llamar tools o responder directamente.
El nodo 'tools' ejecuta las tools seleccionadas por el agente.
Este bucle continúa hasta que el agente decide que tiene suficiente
información para responder al usuario.
"""
from typing import Annotated
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from typing_extensions import TypedDict

from app.core.config import settings
from app.agents.tools.spotify_tools import create_spotify_tools


class AgentState(TypedDict):
    """
    Estado del grafo. 
    
    `messages` usa el reducer `add_messages` de LangGraph:
    en vez de reemplazar la lista entera, AÑADE los nuevos mensajes.
    Esto nos da memoria automática de la conversación.
    """
    messages: Annotated[list[BaseMessage], add_messages]


SYSTEM_PROMPT = """Eres un DJ y analista musical experto con acceso a los datos 
de Spotify del usuario. Tu personalidad es entusiasta, creativa y musical.

Puedes:
- Analizar los gustos musicales del usuario usando sus top artistas y tracks
- Ver su historial de escucha reciente
- Crear playlists personalizadas en su cuenta de Spotify

Cuando el usuario pida algo que requiera datos de Spotify, usa las tools disponibles.
Cuando crees una playlist, primero obtén los tracks relevantes con get_top_tracks,
luego usa sus URIs (formato spotify:track:ID) para crear la playlist.

Responde siempre en el idioma del usuario. Sé conciso pero entusiasta."""


def create_dj_agent(access_token: str):
    """
    Factory que crea el grafo del agente con el token del usuario.
    
    Por qué factory y no singleton:
    Cada usuario tiene su propio access_token. Si usáramos un singleton,
    todos los usuarios compartirían el mismo token — un bug de seguridad grave.
    """
    tools = create_spotify_tools(access_token)

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",  # Modelo gratuito y potente
        api_key=settings.GROQ_API_KEY,
        temperature=0.7,
    ).bind_tools(tools)

    def agent_node(state: AgentState) -> AgentState:
        """
        Nodo principal: el LLM decide si llamar tools o responder.
        Añadimos el SystemMessage aquí para que esté siempre presente.
        """
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        response = llm.invoke(messages)
        return {"messages": [response]}

    # ToolNode ejecuta automáticamente las tools que el LLM seleccionó
    tool_node = ToolNode(tools=tools)

    # Construimos el grafo
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "agent")

    # tools_condition: si el agente quiere llamar tools → "tools", si no → END
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")  # Después de tools, vuelve al agente

    return graph.compile()