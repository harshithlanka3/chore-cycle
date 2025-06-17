class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: { [key: string]: ((data: any) => void)[] } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private shouldReconnect = true;
  private isAuthenticated = false;
  private currentUserId: string | null = null;

  connect(url: string = 'ws://localhost:8000/ws', token?: string, userId?: string) {
    this.shouldReconnect = true;
    this.currentUserId = userId || null;
    
    try {
      console.log('Connecting to WebSocket:', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Authenticate if token is provided
        if (token && userId) {
          this.authenticate(token, userId);
        } else {
          this.send({ type: 'ping' });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isAuthenticated = false;
        if (this.shouldReconnect) {
          this.attemptReconnect(url, token, userId);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      if (this.shouldReconnect) {
        this.attemptReconnect(url, token, userId);
      }
    }
  }

  private authenticate(token: string, userId: string) {
    this.send({
      type: 'auth',
      token: token,
      user_id: userId
    });
  }

  private attemptReconnect(url: string, token?: string, userId?: string) {
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url, token, userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached or reconnection disabled');
    }
  }

  private handleMessage(data: any) {
    const { type } = data;
    
    // Handle authentication responses
    if (type === 'auth_success') {
      this.isAuthenticated = true;
      console.log('WebSocket authenticated successfully');
      return;
    } else if (type === 'auth_failed') {
      console.error('WebSocket authentication failed');
      this.isAuthenticated = false;
      return;
    }

    console.log(`Handling WebSocket message type: ${type}`);
    
    if (this.listeners[type]) {
      console.log(`Found ${this.listeners[type].length} listeners for type: ${type}`);
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    } else {
      console.log(`No listeners found for WebSocket message type: ${type}`);
    }

    // Also trigger generic 'message' listeners for debugging
    if (this.listeners['message']) {
      this.listeners['message'].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in generic WebSocket listener:', error);
        }
      });
    }
  }

  // Rest of the methods remain the same...
  addEventListener(type: string, callback: (data: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
    console.log(`Added WebSocket listener for type: ${type}. Total listeners: ${this.listeners[type].length}`);
  }

  removeEventListener(type: string, callback: (data: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
      console.log(`Removed WebSocket listener for type: ${type}. Remaining listeners: ${this.listeners[type].length}`);
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', data);
      this.ws.send(JSON.stringify(data));
    } else {
      console.log('Cannot send WebSocket message - connection not open. ReadyState:', this.ws?.readyState);
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket...');
    this.shouldReconnect = false;
    this.isAuthenticated = false;
    this.currentUserId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
  }
}

export const websocketService = new WebSocketService();