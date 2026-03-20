import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';

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
  
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.handleOAuthCallback(code);
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
