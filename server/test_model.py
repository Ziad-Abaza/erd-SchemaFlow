import os
from ctransformers import AutoModelForCausalLM

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI", "mistral-7b-instruct-v0.2.Q4_K_M.gguf"))
print(f"Testing model loading from {MODEL_PATH}...")

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
    
    # Test a simple generation
    test_prompt = "[INST] Hello, how are you? [/INST]"
    response = model(test_prompt)
    print(f"Test response: {response}")
    print("Model test passed.")
except Exception as e:
    print(f"Error: {e}")
