from typing import Dict
from app.core.logging import get_logger

logger = get_logger(__name__)

# Very rough cost estimation per 1k tokens (USD)
COSTS = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "claude-3-5-sonnet-20240620": {"input": 0.003, "output": 0.015},
    "deepseek-coder": {"input": 0.0001, "output": 0.0001},
    "codellama": {"input": 0, "output": 0}, # Local Ollama is free
}


class TokenTracker:
    def __init__(self):
        self.usage: Dict[str, Dict[str, int]] = {}

    def track_usage(self, model: str, input_tokens: int, output_tokens: int):
        if model not in self.usage:
            self.usage[model] = {"input": 0, "output": 0}
        
        self.usage[model]["input"] += input_tokens
        self.usage[model]["output"] += output_tokens
        
        cost = self.calculate_cost(model, input_tokens, output_tokens)
        
        logger.info(
            "llm_usage",
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=cost
        )

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        model_costs = COSTS.get(model, {"input": 0, "output": 0})
        input_cost = (input_tokens / 1000) * model_costs["input"]
        output_cost = (output_tokens / 1000) * model_costs["output"]
        return input_cost + output_cost

    def get_total_usage(self) -> Dict[str, Dict[str, int]]:
        return self.usage
