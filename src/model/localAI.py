from ollama import chat

resp = chat(
    model='qwen2.5:1.5b',
    messages=[{
        'role': 'user', 
        'content': 'Hola, ¿sabes la programacion orientada a agentes?'
    }],
)
print(resp.message.content)