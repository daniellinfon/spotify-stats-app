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
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict
import re

from app.core.config import settings
from app.agents.tools.spotify_tools import create_spotify_tools


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    tool_result: str
    iterations: int


SYSTEM_PROMPT = """Eres un DJ experto y apasionado de la música.

REGLAS:
- Si el usuario pregunta sobre UN ARTISTA O CANCIÓN EN GENERAL → responde con tu conocimiento, NO uses tools.
- Si el usuario pregunta sobre SU ESCUCHA, SUS FAVORITOS, o menciona "yo", "mis", "escucho", "me gusta" → usa la tool correspondiente INMEDIATAMENTE sin preguntar permiso.
- Si pide crear una playlist → usa get_top_tracks primero, luego create_playlist.

NUNCA preguntes al usuario si quieres usar una tool. Simplemente úsala.

Responde siempre en español. Sé entusiasta y cercano."""


def parse_tool_call(text: str) -> tuple[str, str] | None:
    """Extrae el nombre y argumento de una línea TOOL: ..."""
    match = re.search(r'TOOL:\s*(\w+)\(([^)]*)\)', text)
    if match:
        return match.group(1), match.group(2).strip()
    return None


def create_dj_agent(access_token: str):
    tools_map = {}
    for t in create_spotify_tools(access_token):
        tools_map[t.name] = t

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=settings.GROQ_API_KEY,
        temperature=0.5,
        max_tokens=1024,
    )

    def agent_node(state: AgentState) -> AgentState:
        # Si hay resultado de una tool, lo añadimos al contexto
        messages = [SystemMessage(content=SYSTEM_PROMPT)]

        for msg in state["messages"]:
            messages.append(msg)

        if state.get("tool_result"):
            messages.append(HumanMessage(
                content=f"RESULTADO de la tool:\n{state['tool_result']}\n\nAhora responde al usuario."
            ))

        response = llm.invoke(messages)
        return {
            "messages": [AIMessage(content=response.content)],
            "tool_result": "",
            "iterations": state.get("iterations", 0) + 1,
        }

    def tool_node(state: AgentState) -> AgentState:
        # Busca el último mensaje del agente para extraer la tool
        last_msg = state["messages"][-1]
        parsed = parse_tool_call(last_msg.content)

        if not parsed:
            return {"tool_result": "", "iterations": state.get("iterations", 0)}

        tool_name, tool_arg = parsed

        try:
            tool = tools_map.get(tool_name)
            if not tool:
                return {"tool_result": f"Tool '{tool_name}' no encontrada."}

            if tool_arg:
                result = tool.invoke({"time_range": tool_arg})
            else:
                result = tool.invoke({})

            return {"tool_result": result}
        except Exception as e:
            return {"tool_result": f"Error ejecutando tool: {str(e)}"}

    def should_use_tool(state: AgentState) -> str:
        # Si el LLM escribió TOOL: en su respuesta, ejecutamos la tool
        if state.get("iterations", 0) >= 3:
            return END  # máximo 3 iteraciones para evitar bucles

        last_msg = state["messages"][-1]
        if "TOOL:" in last_msg.content:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_use_tool)
    graph.add_edge("tools", "agent")

    return graph.compile()