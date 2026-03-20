import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { Message } from './models';
import { environment } from '../../environments/environment';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private stompClient: any = null;
  private messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient?.connected) return;

    const socket = new SockJS(environment.wsUrl);
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = () => {}; // Suppress debug logs

    const merID = this.authService.currentUser?.merID;
    if (!merID) return;

    this.stompClient.connect({}, () => {
      // Subscribe to personal message queue
      this.stompClient.subscribe(
        `/user/${merID}/queue/messages`,
        (frame: any) => {
          const message: Message = JSON.parse(frame.body);
          this.messageSubject.next(message);
        }
      );
    });
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.stompClient = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
