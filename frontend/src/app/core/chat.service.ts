import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, PageResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {

  constructor(private http: HttpClient) {}

  sendMessage(recipientId: string, content: string, mediaId?: string): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/messages/send`, {
      recipientId, content, mediaId
    });
  }

  getMessageById(id: string): Observable<Message> {
    return this.http.get<Message>(`${environment.apiUrl}/messages/${id}`);
  }

  getConversation(withUser: string, page: number = 0, size: number = 50): Observable<PageResponse<Message>> {
    const params = new HttpParams()
      .set('withUser', withUser)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Message>>(`${environment.apiUrl}/messages/conversation`, { params });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/messages/unread/count`);
  }
}
