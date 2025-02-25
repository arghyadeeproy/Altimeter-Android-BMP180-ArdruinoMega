import asyncio
import websockets

async def receive_data():
    uri = "ws://localhost:8080"  # or the port you choose
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            print(f"Received: {message}")

asyncio.run(receive_data())
