import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from ctransformers import AutoModelForCausalLM, AutoTokenizer
import json
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add request validation error handler for 422 errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle 422 validation errors with detailed error messages"""
    logger.error(f"Validation error for {request.url.path}: {exc.errors()}")
    logger.debug(f"Request body: {await request.body()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": str(exc.body) if hasattr(exc, 'body') else None,
            "path": str(request.url.path),
            "message": "Request validation failed. Please check your request format."
        }
    )

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
    # Get context limit from environment (default 2048)
    max_context_tokens = int(os.getenv("AI_MAX_CONTEXT_TOKENS", "2048"))
    print(f"Initializing model with context length: {max_context_tokens}")

    try:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            model_type="mistral",
            gpu_layers=None,
            context_length=max_context_tokens
        )
    except:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            model_type="mistral",
            gpu_layers=0,
            context_length=max_context_tokens
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
        response_text = generate_with_fallback(messages_text)
        
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

def estimate_tokens(text: str) -> int:
    """More accurate token estimation"""
    if not text:
        return 0
    # Better estimation: words (~1.3 tokens/word) + chars (~0.25 tokens/char)
    words = len(text.split())
    chars = len(text)
    word_estimate = words * 1.3
    char_estimate = chars * 0.25
    return int((word_estimate + char_estimate) / 2)

def calculate_available_tokens_for_schema(system_prompt: str, max_context: int = 512, output_buffer: int = 100, safety: int = 50) -> int:
    """Calculate how many tokens are available for schema after accounting for prompt and output"""
    prompt_tokens = estimate_tokens(system_prompt)
    available = max_context - prompt_tokens - output_buffer - safety
    return max(50, available)  # Minimum 50 tokens for schema

def truncate_schema_context(schema: str, max_tokens: int = 200) -> str:
    """Truncate schema context to fit within model's token limit"""
    if not schema:
        return ""
    
    # Use token estimation instead of character count
    schema_tokens = estimate_tokens(schema)
    
    if schema_tokens <= max_tokens:
        return schema
    
    # Truncate based on token count, not character count
    # Rough: 1 token ≈ 4 characters, but we'll be more conservative
    max_chars = max_tokens * 3  # Conservative: 3 chars per token
    
    if len(schema) <= max_chars:
        return schema
    
    # Try to truncate at table boundaries
    lines = schema.split('\n')
    truncated_lines = []
    current_tokens = 0
    
    for line in lines:
        line_tokens = estimate_tokens(line)
        if current_tokens + line_tokens + 1 <= max_tokens:
            truncated_lines.append(line)
            current_tokens += line_tokens + 1
        else:
            break
    
    truncated_schema = '\n'.join(truncated_lines)
    
    # Add indicator that schema was truncated
    if len(truncated_schema) < len(schema):
        truncated_schema += "\n\n[Schema truncated]"
    
    return truncated_schema


def extract_first_json_value(text: str) -> Optional[str]:
    if not text:
        return None

    start_obj = text.find("{")
    start_arr = text.find("[")
    starts = [i for i in (start_obj, start_arr) if i != -1]
    if not starts:
        return None

    start = min(starts)
    stack: List[str] = []
    in_string = False
    escape = False

    for i in range(start, len(text)):
        ch = text[i]

        if in_string:
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
            continue

        if ch in "{[":
            stack.append(ch)
            continue

        if ch in "}]":
            if not stack:
                return None
            top = stack[-1]
            if (top == "{" and ch == "}") or (top == "[" and ch == "]"):
                stack.pop()
                if not stack:
                    return text[start : i + 1]
            else:
                return None

    return None


def repair_common_json_issues(text: str) -> str:
    fixed = text
    fixed = re.sub(r"}\s*{", "},{", fixed)
    fixed = re.sub(r"]\s*\[", "],[", fixed)
    fixed = re.sub(
        r"(true|false|null|-?\d+(?:\.\d+)?|\]|\}|\"[^\"\\]*(?:\\.[^\"\\]*)*\")\s*(\")",
        r"\1,\2",
        fixed,
    )
    fixed = re.sub(r",\s*([}\]])", r"\1", fixed)
    return fixed


def extract_first_json_object_from_array(array_text: str) -> Optional[str]:
    if not array_text:
        return None
    s = array_text.lstrip()
    if not s.startswith("["):
        return None
    inner = s[1:]
    obj = extract_first_json_value(inner)
    if obj and obj.lstrip().startswith("{"):
        return obj
    return None


def generate_with_fallback(prompt: str) -> str:
    try:
        return model(prompt, temperature=0.2, top_p=0.9, max_new_tokens=256)
    except TypeError:
        return model(prompt)


def infer_table_label_from_prompt(prompt: str) -> str:
    if not prompt:
        return "generated_table"
    m = re.search(r"([a-zA-Z_][a-zA-Z0-9_]*)\s+table", prompt, re.IGNORECASE)
    if m:
        return m.group(1).strip().lower()
    return "generated_table"


def validate_and_repair_json(text: str) -> dict:
    """Validate JSON and attempt to repair common corruption issues"""
    if not text:
        raise ValueError("Empty response text")
    
    # Remove corrupted repeated patterns (e.g., "from_from_from_from...")
    text = re.sub(r'(\w+)_\1{3,}', r'\1', text)  # Remove repeated field names
    
    # Remove placeholder values that weren't replaced
    text = re.sub(r'\{table_name\}', '"unknown_table"', text)
    text = re.sub(r'\{column_name\}', '"unknown_column"', text)
    
    # Try to fix incomplete JSON structures
    # Count braces to see if JSON is incomplete
    open_braces = text.count('{')
    close_braces = text.count('}')
    if open_braces > close_braces:
        # Add missing closing braces
        text += '}' * (open_braces - close_braces)
    
    return text

def parse_model_json_response(response_text: str):
    """Parse JSON response with enhanced validation and recovery"""
    text = (response_text or "").strip()
    
    # Remove error messages about token limits
    if "Number of tokens" in text or "exceeded maximum context length" in text:
        logger.warning("Context limit exceeded in response, attempting recovery")
    
    text = text.replace('\\_', '_')
    if text.startswith('"') and '\\"' in text:
        try:
            decoded = json.loads(text)
            if isinstance(decoded, str):
                text = decoded
        except Exception:
            pass

    # Extract from markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Fix common formatting issues
    text = text.replace('}\n    {', '},\n    {')
    text = text.replace(']\n   }', ']\n  }')

    # Remove noise lines
    noise_prefixes = ["Number of tokens", "Model response:", "exceeded maximum context"]
    response_lines = [ln for ln in text.splitlines() if not any(ln.strip().startswith(p) for p in noise_prefixes)]
    text = "\n".join(response_lines).strip()

    # Validate and repair corrupted JSON
    try:
        text = validate_and_repair_json(text)
    except Exception as e:
        logger.warning(f"JSON repair attempt failed: {e}")

    json_candidate = extract_first_json_value(text)
    if not json_candidate:
        raise json.JSONDecodeError("No JSON object found", text, 0)

    first_obj = extract_first_json_object_from_array(json_candidate)
    if first_obj:
        json_candidate = first_obj

    # Try parsing with repair
    try:
        return json.loads(json_candidate)
    except json.JSONDecodeError as e:
        logger.warning(f"Initial JSON parse failed, attempting repair: {e}")
        try:
            repaired = repair_common_json_issues(json_candidate)
            return json.loads(repaired)
        except json.JSONDecodeError as e2:
            logger.error(f"JSON repair failed: {e2}")
            # Return minimal valid structure as last resort
            return {
                "label": "error_table",
                "columns": [],
                "suggested_relationships": [],
                "error": f"Failed to parse JSON: {str(e2)}"
            }


def sanitize_identifier(value: str) -> str:
    s = (value or "").strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_]", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "col"


def normalize_column_type(raw_type: str) -> str:
    t = (raw_type or "").strip()
    if not t:
        return "varchar(255)"
    tl = t.lower()
    mapping = {
        "int": "int",
        "integer": "int",
        "bigint": "bigint",
        "smallint": "smallint",
        "uuid": "uuid",
        "text": "text",
        "string": "varchar(255)",
        "varchar": "varchar(255)",
        "bool": "boolean",
        "boolean": "boolean",
        "datetime": "timestamp",
        "timestamp": "timestamp",
        "date": "date",
        "float": "float",
        "double": "double",
        "decimal": "decimal(10,2)",
    }
    if tl in mapping:
        return mapping[tl]
    return t


def extract_schema_table_names(schema_summary: str) -> List[str]:
    if not schema_summary:
        return []
    names: List[str] = []
    for line in schema_summary.splitlines():
        m = re.match(r"\s*Table\s+([^:]+):", line, re.IGNORECASE)
        if m:
            names.append(sanitize_identifier(m.group(1)))
    return names


def normalize_table_result(result, prompt: str, current_schema: str):
    if isinstance(result, list):
        result = result[0] if result else {}
    if not isinstance(result, dict):
        result = {}

    table_label = result.get("label")
    table_label = sanitize_identifier(str(table_label)) if table_label else infer_table_label_from_prompt(prompt)
    result["label"] = table_label

    cols = result.get("columns")
    if not isinstance(cols, list):
        cols = []

    existing_tables = set(extract_schema_table_names(current_schema))
    used_ids: dict[str, int] = {}
    used_names: dict[str, int] = {}
    normalized_cols = []

    for idx, col in enumerate(cols):
        if not isinstance(col, dict):
            continue

        name = col.get("name") or col.get("id") or f"column_{idx+1}"
        name = sanitize_identifier(str(name))
        used_names[name] = used_names.get(name, 0) + 1
        if used_names[name] > 1:
            name = f"{name}_{used_names[name]}"

        col_id = col.get("id") or name
        col_id = sanitize_identifier(str(col_id))
        used_ids[col_id] = used_ids.get(col_id, 0) + 1
        if used_ids[col_id] > 1:
            col_id = f"{col_id}_{used_ids[col_id]}"

        is_pk = bool(col.get("isPrimaryKey", False))
        inferred_fk = name.endswith("_id") and name != "id"
        is_fk = bool(col.get("isForeignKey", inferred_fk))

        is_nullable_default = False if (is_pk or is_fk) else True
        is_nullable = bool(col.get("isNullable", is_nullable_default))
        if is_pk:
            is_nullable = False

        normalized = {
            **col,
            "id": col_id,
            "name": name,
            "type": normalize_column_type(str(col.get("type", ""))),
            "isPrimaryKey": is_pk,
            "isForeignKey": is_fk,
            "isNullable": is_nullable,
        }

        if is_fk and not normalized.get("referencedTable") and existing_tables:
            base = sanitize_identifier(name[:-3])
            candidates = [base, f"{base}s", f"{base}es"]
            ref = next((c for c in candidates if c in existing_tables), None)
            if ref:
                normalized["referencedTable"] = ref
                normalized["referencedColumn"] = normalized.get("referencedColumn") or "id"

        normalized_cols.append(normalized)

    existing_names = {c.get("name") for c in normalized_cols}
    existing_ids = {c.get("id") for c in normalized_cols}

    if not any(bool(c.get("isPrimaryKey")) for c in normalized_cols):
        pk_name = "id" if "id" not in existing_names else "id_pk"
        pk_id = "id" if "id" not in existing_ids else "id_pk"
        suffix = 2
        while pk_name in existing_names:
            pk_name = f"id_pk_{suffix}"
            suffix += 1
        suffix = 2
        while pk_id in existing_ids:
            pk_id = f"id_pk_{suffix}"
            suffix += 1

        normalized_cols.insert(
            0,
            {
                "id": pk_id,
                "name": pk_name,
                "type": "uuid",
                "isPrimaryKey": True,
                "isForeignKey": False,
                "isNullable": False,
            },
        )
        existing_names.add(pk_name)
        existing_ids.add(pk_id)

    p = (prompt or "").lower()
    if "no timestamp" not in p and "without timestamp" not in p:
        for ts_name in ("created_at", "updated_at"):
            if ts_name in existing_names:
                continue
            ts_id = ts_name
            suffix = 2
            while ts_id in existing_ids:
                ts_id = f"{ts_name}_{suffix}"
                suffix += 1
            normalized_cols.append({"id": ts_id, "name": ts_name, "type": "timestamp", "isPrimaryKey": False, "isForeignKey": False, "isNullable": False})
            existing_names.add(ts_name)
            existing_ids.add(ts_id)

    result["columns"] = normalized_cols
    suggestions = result.get("suggested_relationships")
    if not isinstance(suggestions, list):
        suggestions = []

    key_set = set()
    normalized_suggestions = []
    for s in suggestions:
        if not isinstance(s, dict):
            continue
        from_table = s.get("from_table")
        from_column = s.get("from_column")
        to_table = s.get("to_table")
        to_column = s.get("to_column")
        relationship_type = s.get("relationship_type")
        confidence = s.get("confidence")
        reason = s.get("reason")

        if not (from_table and from_column and to_table and to_column and relationship_type):
            continue

        k = (
            sanitize_identifier(str(from_table)),
            sanitize_identifier(str(from_column)),
            sanitize_identifier(str(to_table)),
            sanitize_identifier(str(to_column)),
            str(relationship_type).lower(),
        )
        if k in key_set:
            continue
        key_set.add(k)
        normalized_suggestions.append({
            "from_table": sanitize_identifier(str(from_table)),
            "from_column": sanitize_identifier(str(from_column)),
            "to_table": sanitize_identifier(str(to_table)),
            "to_column": sanitize_identifier(str(to_column)),
            "relationship_type": str(relationship_type).lower(),
            "confidence": str(confidence).lower() if confidence else "medium",
            "reason": str(reason) if reason else "Inferred relationship",
        })

    if not normalized_suggestions:
        table_label = sanitize_identifier(str(result.get("label") or infer_table_label_from_prompt(prompt)))
        for col in normalized_cols:
            if not isinstance(col, dict):
                continue
            if not col.get("isForeignKey"):
                continue
            ref_table = col.get("referencedTable")
            if not ref_table:
                continue
            ref_col = col.get("referencedColumn") or "id"
            k = (table_label, sanitize_identifier(str(col.get("name") or col.get("id") or "")), sanitize_identifier(str(ref_table)), sanitize_identifier(str(ref_col)), "one_to_many")
            if k in key_set:
                continue
            key_set.add(k)
            normalized_suggestions.append({
                "from_table": table_label,
                "from_column": sanitize_identifier(str(col.get("name") or col.get("id") or "")),
                "to_table": sanitize_identifier(str(ref_table)),
                "to_column": sanitize_identifier(str(ref_col)),
                "relationship_type": "one_to_many",
                "confidence": "medium",
                "reason": "Inferred from *_id column pattern and existing schema",
            })

    result["suggested_relationships"] = normalized_suggestions
    return result

class CreateTableRequest(BaseModel):
    prompt: str
    current_schema: Optional[str] = ""

@app.post("/api/create-table")
async def create_table_ai(request: CreateTableRequest):
    if not model:
        # Mock response when model is not available
        return {
            "label": "example_table",
            "columns": [
                {"id": "uuid", "name": "id", "type": "uuid", "isPrimaryKey": True, "isForeignKey": False, "isNullable": False},
                {"id": "name", "name": "name", "type": "varchar", "isPrimaryKey": False, "isForeignKey": False, "isNullable": False},
                {"id": "created_at", "name": "created_at", "type": "timestamp", "isPrimaryKey": False, "isForeignKey": False, "isNullable": False}
            ],
            "suggested_relationships": []
        }

    # Get model context limit from environment (default 512 for Mistral)
    max_context = int(os.getenv("AI_MAX_CONTEXT_TOKENS", "512"))
    
    # Compact system prompt to save tokens
    compact_prompt = f"""Create table: "{request.prompt}"
Schema: {{schema}}

Return ONLY JSON (no comments):
{{"label":"table_name","columns":[{{"id":"col_id","name":"col_name","type":"data_type","isPrimaryKey":true,"isForeignKey":false,"isNullable":false}}],"suggested_relationships":[{{"from_table":"child","from_column":"fk_col","to_table":"parent","to_column":"id","relationship_type":"one_to_many","confidence":"high"}}]}}

Rules: snake_case, unique ids, primary key id (uuid), mark *_id as foreign keys if parent table exists."""
    
    # Calculate available tokens for schema
    available_tokens = calculate_available_tokens_for_schema(compact_prompt, max_context, output_buffer=150, safety=50)
    
    # Truncate schema to fit
    truncated_schema = truncate_schema_context(request.current_schema, max_tokens=available_tokens)
    
    # Build final prompt
    system_prompt = compact_prompt.replace("{schema}", truncated_schema)

    messages_text = f"[INST] {system_prompt} [/INST]"

    fallback_prompt = f"""Create table from: \"{request.prompt}\"\n\nReturn ONLY valid JSON without comments as a single object:\n{{\n  \"label\": \"table_name\",\n  \"columns\": [\n    {{\"id\": \"uuid\", \"name\": \"col_name\", \"type\": \"data_type\", \"isPrimaryKey\": true, \"isForeignKey\": false, \"isNullable\": false}}\n  ],\n  \"suggested_relationships\": []\n}}\n\nNo comments, no explanations, just JSON."""
    fallback_messages_text = f"[INST] {fallback_prompt} [/INST]"

    last_error: Optional[Exception] = None
    last_raw: str = ""
    
    # Validate token count before sending
    estimated_tokens = estimate_tokens(messages_text)
    max_context = int(os.getenv("AI_MAX_CONTEXT_TOKENS", "512"))
    
    if estimated_tokens > max_context:
        logger.warning(f"Request exceeds context limit: {estimated_tokens} > {max_context}")
        # Further truncate if needed
        available_tokens = calculate_available_tokens_for_schema(compact_prompt, max_context, output_buffer=150, safety=50)
        truncated_schema = truncate_schema_context(request.current_schema, max_tokens=available_tokens)
        system_prompt = compact_prompt.replace("{schema}", truncated_schema)
        messages_text = f"[INST] {system_prompt} [/INST]"
        estimated_tokens = estimate_tokens(messages_text)
        logger.info(f"After truncation: {estimated_tokens} tokens")
    
    for attempt_idx, attempt_prompt in enumerate([messages_text, fallback_messages_text], start=1):
        try:
            # Log token usage
            prompt_tokens = estimate_tokens(attempt_prompt)
            logger.info(f"Attempt {attempt_idx}: Sending request with ~{prompt_tokens} tokens (limit: {max_context})")
            
            response_text = generate_with_fallback(attempt_prompt)
            last_raw = response_text
            logger.debug(f"Model response (attempt {attempt_idx}): {response_text[:500]}")
            
            result = parse_model_json_response(response_text)
            
            # Validate result structure
            if not isinstance(result, dict):
                raise ValueError(f"Expected dict, got {type(result)}")
            
            result = normalize_table_result(result, request.prompt, request.current_schema or "")
            
            # Log success
            logger.info(f"Successfully created table: {result.get('label', 'unknown')}")
            return result
        except Exception as e:
            last_error = e
            logger.error(f"Attempt {attempt_idx} failed: {str(e)}")
            continue

    # All attempts failed - return fallback with detailed error
    inferred_label = infer_table_label_from_prompt(request.prompt)
    error_message = f"AI output invalid JSON after 2 attempts. Last error: {str(last_error)}"
    if "context length" in str(last_error).lower() or estimated_tokens > max_context:
        error_message += f" Context limit may have been exceeded ({estimated_tokens} tokens). Consider using a model with larger context or reducing schema size."
    
    logger.error(error_message)
    return {
        "label": inferred_label,
        "columns": [
            {"id": "id", "name": "id", "type": "uuid", "isPrimaryKey": True, "isForeignKey": False, "isNullable": False}
        ],
        "suggested_relationships": [],
        "error": error_message,
        "metadata": {
            "estimated_tokens": estimated_tokens,
            "max_context": max_context,
            "raw_response_preview": last_raw[:200] if last_raw else None
        }
    }

class CreateRelationshipsRequest(BaseModel):
    table_name: str
    current_schema: Optional[str] = ""

@app.post("/api/auto-create-relationships")
async def auto_create_relationships(request: CreateRelationshipsRequest):
    if not model:
        # Mock response when model is not available
        return {
            "relationships": [
                {
                    "from_table": request.table_name,
                    "from_column": "id",
                    "to_table": "existing_table",
                    "to_column": "id",
                    "relationship_type": "one_to_many",
                    "confidence": "medium",
                    "reason": "Mock mode: Running without AI model. Please check model path and dependencies."
                }
            ]
        }

    # Get model context limit from environment
    max_context = int(os.getenv("AI_MAX_CONTEXT_TOKENS", "512"))
    
    # Compact prompt template
    prompt_template = """Find relationships for: "{table_name}"
Schema: {{schema}}
Return JSON: {{"relationships":[{{"from_table":"child","from_column":"fk","to_table":"parent","to_column":"id","relationship_type":"one_to_many","confidence":"high","reason":"FK matches table"}}]}}"""
    
    # Calculate available tokens for schema
    available_tokens = calculate_available_tokens_for_schema(
        prompt_template.format(table_name=request.table_name, schema=""), 
        max_context, 
        output_buffer=150, 
        safety=50
    )
    
    # Truncate schema to fit
    truncated_schema = truncate_schema_context(request.current_schema, max_tokens=available_tokens)
    
    # Build final prompt
    system_prompt = prompt_template.format(table_name=request.table_name, schema=truncated_schema)

    messages_text = f"[INST] {system_prompt} [/INST]"

    try:
        response_text = generate_with_fallback(messages_text)
        result = parse_model_json_response(response_text)
        
        # Ensure relationships exists
        if "relationships" not in result:
            result["relationships"] = []
        
        return result
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

    # Get model context limit from environment
    max_context = int(os.getenv("AI_MAX_CONTEXT_TOKENS", "512"))
    
    # Compact prompt template
    prompt_template = """Analyze ERD:
{{erd}}
Return JSON: {{"suggestions":[{{"type":"add_foreign_key","title":"Title","details":"Details","severity":"info","actions":[{{"action":"add_foreign_key","payload":{{}}}}]}}]}}
Focus: missing FKs, indexes, normalization, naming."""
    
    # Calculate available tokens for ERD state
    available_tokens = calculate_available_tokens_for_schema(
        prompt_template.format(erd=""), 
        max_context, 
        output_buffer=200, 
        safety=50
    )
    
    # Truncate ERD state to fit
    erd_json = json.dumps(erd_state)
    truncated_erd = truncate_schema_context(erd_json, max_tokens=available_tokens)
    
    # Build final prompt
    system_prompt = prompt_template.format(erd=truncated_erd)

    user_prompt = ""
    messages_text = f"[INST] {system_prompt} {user_prompt} [/INST]"

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
