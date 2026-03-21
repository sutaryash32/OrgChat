import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { Message } from './models';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private authService = inject(AuthService);
  private stompClient: Client | null = null;
  private messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();
  private connectionSubject = new Subject<boolean>();
  public connected$ = this.connectionSubject.asObservable();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.stompClient?.active) return;

    const merID = this.authService.merID;
    const token = this.authService.token;
    if (!merID || !token) {
      console.warn('WebSocket: Missing authentication credentials');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl, null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'] }) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (msg: string) => console.debug('[STOMP]', msg),

      onConnect: () => {
        console.log('[WebSocket] Connected to STOMP broker');
        this.reconnectAttempts = 0;
        this.connectionSubject.next(true);

        this.stompClient!.subscribe(
          `/user/queue/messages`,
          (frame: IMessage) => {
            try {
              const message: Message = JSON.parse(frame.body);
              this.messageSubject.next(message);
            } catch (err) {
              console.error('[WebSocket] Failed to parse message:', err);
            }
          }
        );
      },

      onDisconnect: () => {
        console.warn('[WebSocket] Disconnected from STOMP broker');
        this.connectionSubject.next(false);
      },

      onStompError: (frame) => {
        const errorMsg = frame.headers['message'] || 'Unknown STOMP error';
        console.error('[WebSocket] STOMP error:', errorMsg, frame);
        this.connectionSubject.next(false);
      },

      onWebSocketError: (event: Event) => {
        console.error('[WebSocket] WebSocket error:', event);
        this.connectionSubject.next(false);
      },

      onWebSocketClose: () => {
        console.warn('[WebSocket] WebSocket connection closed');
        this.connectionSubject.next(false);
      }
    });

    try {
      this.stompClient.activate();
    } catch (err) {
      console.error('[WebSocket] Failed to activate STOMP client:', err);
      this.connectionSubject.next(false);
    }
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.connectionSubject.next(false);
    }
  }

  isConnected(): boolean {
    return this.stompClient?.active ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.messageSubject.complete();
    this.connectionSubject.complete();
  }
}

