type WSMessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws';

  connect(reviewId: string, onMessage: WSMessageHandler) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for WebSocket connection');
      return;
    }

    const wsUrl = `${this.url}/${reviewId}?token=${token}`;
    
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const wsService = new WebSocketService();
