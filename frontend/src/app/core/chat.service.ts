import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Message, MultiMessageRequest, ConversationSummary } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/messages`;

  sendMessage(recipientId: string, content: string, mediaId?: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/send`, {
      recipientId,
      content,
      mediaId
    });
  }

  sendToMultiple(recipientIds: string[], content: string, mediaId?: string): Observable<Message[]> {
    const request: MultiMessageRequest = {
      recipientIds,
      content,
      mediaId
    };
    return this.http.post<Message[]>(`${this.apiUrl}/send-multi`, request);
  }

  getConversation(merID1: string, merID2: string, page: number = 0, pageSize: number = 50): Observable<Message[]> {
    const params = new HttpParams()
      .set('withUser', merID2)
      .set('page', page.toString())
      .set('size', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/conversation`, { params })
      .pipe(map(response => response.content as Message[]));
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread/count`);
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`);
  }

  getInbox(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(`${this.apiUrl}/inbox`);
  }

  deleteConversation(withUser: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversation?withUser=${withUser}`);
  }
}

