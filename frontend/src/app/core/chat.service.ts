import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/messages';

  sendMessage(recipientId: string, content: string, mediaId?: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/send`, {
      recipientId,
      content,
      mediaId
    });
  }

  getConversation(merID1: string, merID2: string, page: number = 0, pageSize: number = 50): Observable<Message[]> {
    const params = new HttpParams()
      .set('merID1', merID1)
      .set('merID2', merID2)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<Message[]>(`${this.apiUrl}/conversation`, { params });
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread/count`);
  }
}
