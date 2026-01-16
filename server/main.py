import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ctransformers import AutoModelForCausalLM, AutoTokenizer
import json

app = FastAPI()

# Configuration
_default_model_path = os.path.join(os.path.dirname(__file__), "..", "AI", "mistral-7b-instruct-v0.2.Q4_K_M.gguf")
_env_model_path = os.getenv("MODEL_PATH")
# If env var points to an existing local path, use its absolute path; otherwise use it as-is (to allow HF repo IDs)
if _env_model_path:
    MODEL_PATH = os.path.abspath(_env_model_path) if os.path.exists(_env_model_path) else _env_model_path
else:
    MODEL_PATH = os.path.abspath(_default_model_path)

import traceback

print(f"Loading model from {MODEL_PATH}...")

model = None
model_load_error: Optional[str] = None

try:
    # Try with GPU layers first, fallback to CPU if needed
    try:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            model_type="mistral",
            gpu_layers=None
        )
    except:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            model_type="mistral",
            gpu_layers=0
        )
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model:")
    traceback.print_exc()
    model_load_error = str(e)

class Message(BaseModel):
    role: str
    content: str

from fastapi.responses import StreamingResponse
import asyncio

class ChatRequest(BaseModel):
    messages: List[Message]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    enable_thinking: Optional[bool] = False
    stream: Optional[bool] = False

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    if not model:
        # Mock streaming response when model is not available
        mock_content = "I'm currently running in mock mode because the model could not be loaded. Please check the model path and dependencies."
        
        if request.stream:
            async def mock_stream_generator():
                words = mock_content.split(' ')
                for i, word in enumerate(words):
                    data = {
                        "choices": [{
                            "delta": {"content": word + (" " if i < len(words)-1 else "")},
                            "index": 0,
                            "finish_reason": None if i < len(words)-1 else "stop"
                        }]
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    await asyncio.sleep(0.05)  # Small delay to simulate streaming
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(mock_stream_generator(), media_type="text/event-stream")
        else:
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": mock_content
                        }
                    }
                ]
            }

    try:
        # Format messages for Mistral Instruct
        messages_text = ""
        for msg in request.messages:
            if msg.role == "user":
                messages_text += f"[INST] {msg.content} [/INST]"
            elif msg.role == "assistant":
                messages_text += f" {msg.content}"
            elif msg.role == "system":
                messages_text += f"[INST] {msg.content} [/INST]"
        
        if request.stream:
            async def stream_generator():
                # Generate response in streaming mode
                full_response = ""
                for text in model(messages_text, stream=True):
                    chunk = text
                    full_response += chunk
                    data = {
                        "choices": [{
                            "delta": {"content": chunk},
                            "index": 0,
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    await asyncio.sleep(0.01)
                
                # Send final message
                data = {
                    "choices": [{
                        "delta": {},
                        "index": 0,
                        "finish_reason": "stop"
                    }]
                }
                yield f"data: {json.dumps(data)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
        # Non-streaming response
        response_text = model(messages_text)
        
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    }
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-table")
async def create_table_ai(prompt: str, current_schema: Optional[str] = ""):
    if not model:
        # Mock response when model is not available
        return {
            "label": "example_table",
            "columns": [
                {"id": "uuid", "name": "id", "type": "uuid", "isPrimaryKey": True, "isForeignKey": False, "isNullable": False},
                {"id": "name", "name": "name", "type": "varchar", "isPrimaryKey": False, "isForeignKey": False, "isNullable": False},
                {"id": "created_at", "name": "created_at", "type": "timestamp", "isPrimaryKey": False, "isForeignKey": False, "isNullable": False}
            ]
        }

    system_prompt = f"""
    You are a database expert. The user wants to create a new table based on a description.
    Consider the existing schema context: {current_schema}
    
    Respond ONLY with a JSON object representing the table structure:
    {{
      "label": "table_name",
      "columns": [
        {{ "id": "uuid", "name": "col_name", "type": "data_type", "isPrimaryKey": true/false, "isForeignKey": true/false, "isNullable": true/false, "referencedTable": "optional", "referencedColumn": "optional" }}
      ]
    }}
    """

    messages_text = f"[INST] {system_prompt}\n\nUser request: {prompt} [/INST]"

    try:
        response_text = model(messages_text)
        
        # Clean and parse JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/suggestions")
async def get_suggestions(erd_state: dict):
    if not model:
        # Mock response when model is not available
        return {
            "suggestions": [
                {
                    "id": "mock-1",
                    "type": "add_foreign_key",
                    "title": "Consider adding foreign key constraints",
                    "details": "Mock mode: Running without AI model. Please check model path and dependencies.",
                    "severity": "info",
                    "actions": []
                }
            ]
        }

    system_prompt = """
    You are a senior database architect. Analyze the provided ERD state and suggest optimizations.
    Focus on:
    1. Normalization (e.g., suggesting new tables for redundant data)
    2. Missing Foreign Keys
    3. Performance (suggesting indexes)
    4. Naming consistency
    5. Missing standard columns (e.g., created_at, updated_at)

    Respond ONLY with a JSON object in the following format:
    {
      "suggestions": [
        {
          "id": "unique-id",
          "type": "add_foreign_key" | "add_index" | "change_column_type" | "rename_column" | "normalize_table" | "add_unique_constraint",
          "title": "Short headline",
          "details": "Rationale",
          "severity": "info" | "warning" | "error",
          "actions": [
            {
              "action": "create_fk" | "create_index" | "update_column" | "create_table",
              "payload": { ... }
            }
          ]
        }
      ]
    }
    """

    user_prompt = f"ERD State: {json.dumps(erd_state)}"
    messages_text = f"[INST] {system_prompt}\n\n{user_prompt} [/INST]"

    try:
        response_text = model(messages_text)
        
        # Try to parse JSON
        try:
            # Clean response text in case of markdown blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            return json.loads(response_text)
        except:
            return {"suggestions": [], "raw_response": response_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
