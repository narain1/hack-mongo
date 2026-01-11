# Model-Agnostic LLM API

A containerized, model-agnostic LLM API built with FastAPI that can be deployed alongside Cloudflared for secure tunnel access.

## Features

- **Model-Agnostic**: Supports multiple LLM backends through configuration
- **RESTful API**: Clean endpoints for text generation and chat completion
- **Dockerized**: Easy deployment with Docker and Docker Compose
- **Cloudflare Tunnel**: Secure external access without exposing ports
- **Health Monitoring**: Built-in health checks and monitoring endpoints

## API Endpoints

- `GET /` - API information and status
- `POST /llm` - Single prompt completion
- `POST /chat` - Chat completion for conversations
- `GET /models` - List available models
- `GET /health` - Health check endpoint

## Quick Start

1. **Clone and setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Test the API**:
   ```bash
   # Single prompt
   curl -X POST http://localhost:8000/llm \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, world!", "max_tokens": 50}'

   # Chat completion
   curl -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {"role": "user", "content": "Hello!"}
       ],
       "max_tokens": 50
     }'
   ```

## Configuration

### Environment Variables

- `MODEL_TYPE`: Type of model backend (`mock`, `openai`, `local`, etc.)
- `MODEL_NAME`: Name of the specific model to use
- `CLOUDFLARE_TUNNEL_TOKEN`: Your Cloudflare tunnel token

### Model Backends

The API is designed to support multiple backends.

- **OpenAI with Tool Calling** (Enabled when `MODEL_TYPE=openai`):
  - Supports `client.responses` API pattern.
  - Includes a built-in `get_horoscope` tool example.
  - Automatically handles tool execution loop.

- **Mock** (default): Returns mock responses for testing.

## Tool Calling Example

The API automatically defines a `get_horoscope` tool. You can trigger it by asking about horoscopes.

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is my horoscope? I am an Aquarius."}
    ],
    "model": "gpt-4o"
  }'
```

## Cloudflare Tunnel Setup

1. **Configure ingress in Cloudflare Dashboard**:
   ```yaml
   ingress:
     - hostname: llm.yourdomain.com
       service: http://llm-api:8000
     - service: http_status:404
   ```

2. **Access your API**:
   - Local: `http://localhost:8000`
   - Tunnel: `https://llm.yourdomain.com`

## Adding Model Backends

To add support for a new model backend:

1. Add the required dependencies to `requirements.txt`
2. Implement the model logic in `main.py`
3. Add environment variables for configuration
4. Update the docker-compose.yml if needed

Example for OpenAI:
```python
if model_type == "openai":
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": request.prompt}],
        max_tokens=request.max_tokens
    )
    response_text = response.choices[0].message.content
```

## Security Notes

- Never commit real API keys or tokens to version control
- Use `.env` files for sensitive configuration
- The Docker container runs as non-root user for security
- Consider adding authentication for production use

## Monitoring

The API includes built-in monitoring endpoints:
- Health checks at `/health`
- Model information at `/models`
- API status at `/`