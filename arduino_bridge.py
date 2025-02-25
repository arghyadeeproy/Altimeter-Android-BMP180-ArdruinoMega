import asyncio
import serial_asyncio
import websockets

SERIAL_PORT = 'COM7'  # Update with your Arduino's port (e.g., COM7 if that's correct)
BAUD_RATE = 9600
WS_HOST = "localhost"
WS_PORT = 8080

# Global variable to store the latest JSON data from Arduino
latest_data = None

class SerialReader(asyncio.Protocol):
    def connection_made(self, transport):
        print(f"Serial port opened: {transport}")
        self.transport = transport
        self.buffer = b""
    
    def data_received(self, data):
        self.buffer += data
        while b'\n' in self.buffer:
            line, self.buffer = self.buffer.split(b'\n', 1)
            decoded_line = line.decode('utf-8').strip()
            print(f"Received from Arduino: {decoded_line}")
            global latest_data
            latest_data = decoded_line

    def connection_lost(self, exc):
        print("Serial port closed. Attempting to reconnect in 5 seconds...")
        # Instead of stopping the event loop, schedule a reconnect
        asyncio.create_task(reconnect_serial())

async def reconnect_serial():
    await asyncio.sleep(5)  # wait before trying to reconnect
    loop = asyncio.get_running_loop()
    try:
        await serial_asyncio.create_serial_connection(loop, SerialReader, SERIAL_PORT, baudrate=BAUD_RATE)
        print(f"Reconnected to serial port {SERIAL_PORT}")
    except Exception as e:
        print(f"Failed to reconnect: {e}")
        # Try reconnecting again after a delay
        asyncio.create_task(reconnect_serial())

async def websocket_handler(websocket, path=None):
    print(f"New client connected: {websocket.remote_address}")
    try:
        while True:
            await asyncio.sleep(1)  # Adjust frequency as needed
            if latest_data is not None:
                try:
                    await websocket.send(latest_data)
                    print(f"Sent to client: {latest_data}")
                except websockets.exceptions.ConnectionClosed:
                    print("Client disconnected")
                    break
    except Exception as e:
        print(f"Error in WebSocket handler: {e}")

async def main():
    loop = asyncio.get_running_loop()

    try:
        await serial_asyncio.create_serial_connection(loop, SerialReader, SERIAL_PORT, baudrate=BAUD_RATE)
        print(f"Listening on serial port {SERIAL_PORT} at {BAUD_RATE} baud.")
    except Exception as e:
        print(f"Error opening serial port: {e}")

    ws_server = await websockets.serve(websocket_handler, WS_HOST, WS_PORT)
    print(f"WebSocket server started at ws://{WS_HOST}:{WS_PORT}")
    
    # Run forever
    await asyncio.Future()

if __name__ == '__main__':
    asyncio.run(main())
