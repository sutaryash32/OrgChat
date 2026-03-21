import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private userService = inject(UserService);
  
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const token = params['token'];
      const merID = params['merID'];

      if (token && merID) {
        // Handle redirect from backend OAuth2 success handler
        this.handleTokenRedirect(token, merID, params['email'] || '', params['displayName'] || '');
        return;
      }

      const code = params['code'];
      if (code) {
        this.handleOAuthCallback(code);
      }
    });
  }

  private handleTokenRedirect(token: string, merID: string, email: string, displayName: string): void {
    localStorage.setItem('orgchat_token', token);
    
    this.userService.getUserByMerID(merID).subscribe({
      next: (userProfile: any) => {
        this.authService.updateCurrentUser(userProfile);
        this.router.navigate(['/chat']);
      },
      error: (err: any) => {
        console.error('Failed to fetch user profile, using basic info', err);
        const user = {
          id: merID,
          merID: merID,
          displayName: displayName || (email ? email.split('@')[0] : merID),
          email: email,
          role: 'USER',
          ssoProvider: 'google'
        };
        this.authService.updateCurrentUser(user);
        this.router.navigate(['/chat']);
      }
    });
  }

  loginWithGoogle(): void {
    this.loading = true;
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  private handleOAuthCallback(code: string): void {
    this.authService.handleSSOCallback(code).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.errorMessage = 'Login failed. Please try again.';
        this.loading = false;
        console.error('Auth error:', err);
      }
    });
  }
}
