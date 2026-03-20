import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private userKey = 'orgchat_user';
  private accessToken: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem(this.userKey);
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  get token(): string | null {
    return this.accessToken;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  loginWithGoogle(): void {
    window.location.href = environment.googleAuthUrl;
  }

  handleAuthCallback(token: string, merID: string): void {
    this.accessToken = token;
    // Fetch full user profile
    this.http.get<User>(`${environment.apiUrl}/users/${merID}`).subscribe({
      next: (user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.router.navigate(['/chat']);
      },
      error: () => {
        // Still set basic info
        const basicUser: User = {
          id: '', merID, email: '', displayName: merID,
          role: 'USER', ssoProvider: 'google'
        };
        localStorage.setItem(this.userKey, JSON.stringify(basicUser));
        this.currentUserSubject.next(basicUser);
        this.router.navigate(['/chat']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
      token: this.token
    }).pipe(
      tap(response => {
        this.accessToken = response.token;
      })
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.accessToken = null;
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
