import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
import traceback

MODEL_PATH = "AI"

print(f"Testing model loading from {MODEL_PATH}...")
print(f"Device: {'cuda' if torch.cuda.is_available() else 'cpu'}")

try:
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    print("Tokenizer loaded.")
    
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        device_map="auto" if torch.cuda.is_available() else None,
        dtype=torch.float32  # Force CPU friendly
    )
    print("Model loaded successfully!")
except Exception as e:
    print("\nFAILED TO LOAD MODEL:")
    traceback.print_exc()
