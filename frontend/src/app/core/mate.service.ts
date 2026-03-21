import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from './models';

export interface MateRequest {
  id: string;
  fromMerID: string;
  toMerID: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MateService {

  constructor(private http: HttpClient) {}

  /** Search for a user by merID */
  searchUser(merID: string): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/mates/search`, {
      params: { merID }
    });
  }

  /** Send a mate request */
  sendRequest(toMerID: string): Observable<MateRequest> {
    return this.http.post<MateRequest>(`${environment.apiUrl}/mates/request`, { toMerID });
  }

  /** Accept a mate request */
  acceptRequest(requestId: string): Observable<MateRequest> {
    return this.http.put<MateRequest>(`${environment.apiUrl}/mates/accept/${requestId}`, {});
  }

  /** Reject a mate request */
  rejectRequest(requestId: string): Observable<MateRequest> {
    return this.http.put<MateRequest>(`${environment.apiUrl}/mates/reject/${requestId}`, {});
  }

  /** Get pending (incoming) requests */
  getPendingRequests(): Observable<MateRequest[]> {
    return this.http.get<MateRequest[]>(`${environment.apiUrl}/mates/pending`);
  }

  /** Get sent (outgoing) requests */
  getSentRequests(): Observable<MateRequest[]> {
    return this.http.get<MateRequest[]>(`${environment.apiUrl}/mates/sent`);
  }

  /** Get accepted mates */
  getMates(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/mates/list`);
  }
}
