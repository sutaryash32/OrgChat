import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { Message } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient?.active) return;

    const merID = this.authService.currentUser?.merID;
    const token = this.authService.token;
    if (!merID || !token) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as any,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},   // Suppress debug logs

      onConnect: () => {
        // Subscribe to personal message queue
        this.stompClient!.subscribe(
          `/user/${merID}/queue/messages`,
          (frame: IMessage) => {
            const message: Message = JSON.parse(frame.body);
            this.messageSubject.next(message);
          }
        );
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      }
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
