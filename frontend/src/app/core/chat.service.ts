import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, PageResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {

  constructor(private http: HttpClient) {}

  /**
   * Start a chat session with another user by their merID.
   * Returns the recipient's user profile.
   */
  startChat(recipientMerID: string): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/chat/start/${recipientMerID}`, {});
  }

  /**
   * Send a message to a recipient by merID.
   */
  sendMessage(recipientId: string, content: string, mediaId?: string): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/chat/send`, {
      recipientId, content, mediaId
    });
  }

  getMessageById(id: string): Observable<Message> {
    return this.http.get<Message>(`${environment.apiUrl}/messages/${id}`);
  }

  /**
   * Get conversation history with another user by merID.
   */
  getConversation(withMerID: string, page: number = 0, size: number = 50): Observable<PageResponse<Message>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Message>>(`${environment.apiUrl}/chat/conversation/${withMerID}`, { params });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/chat/unread/count`);
  }
}
