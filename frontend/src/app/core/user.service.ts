import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private http: HttpClient) {}

  getUserByMerID(merID: string): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${merID}`);
  }

  getAllUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${environment.apiUrl}/users`);
  }
}
