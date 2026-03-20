import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
              <path d="M14 16h20v3H14zM14 22h16v3H14zM14 28h12v3H14z" fill="white" opacity="0.9"/>
              <circle cx="36" cy="32" r="6" fill="#4ade80"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop stop-color="#6366f1"/>
                  <stop offset="1" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="app-title">OrgChat</h1>
          <p class="app-subtitle">Secure media sharing & messaging — Prototype</p>
        </div>

        <button class="sso-button" (click)="loginWithGoogle()" id="sso-login-btn">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div class="divider">
          <span>Prototype — merID</span>
        </div>

        <p class="footer-text">
          Sign in with your Google account.<br>
          <strong>sutaryash32&#64;gmail.com → sutaryash32</strong>
        </p>
      </div>

      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf4ff 100%);
      position: relative; overflow: hidden;
    }

    .login-card {
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 24px; padding: 48px 40px;
      width: 100%; max-width: 420px; text-align: center;
      z-index: 1; animation: fadeInUp 0.6s ease-out;
      box-shadow: 0 8px 32px rgba(99,102,241,0.08);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-section { margin-bottom: 32px; }

    .logo-icon {
      width: 72px; height: 72px; margin: 0 auto 16px;
      animation: float 3s ease-in-out infinite;
    }
    .logo-icon svg { width: 100%; height: 100%; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .app-title {
      font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin: 0 0 8px;
    }

    .app-subtitle { color: #9ca3af; font-size: 0.9rem; margin: 0; line-height: 1.5; }

    .sso-button {
      width: 100%; padding: 14px 24px;
      border: 1px solid #e0e2e8; border-radius: 12px;
      background: #ffffff; color: #1a1a2e;
      font-size: 1rem; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 12px;
      transition: all 0.3s ease; font-family: 'Inter', sans-serif;
    }
    .sso-button:hover {
      background: #f5f6fa; border-color: rgba(99,102,241,0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99,102,241,0.12);
    }

    .google-icon { width: 22px; height: 22px; }

    .divider {
      display: flex; align-items: center; margin: 28px 0;
      color: #9ca3af; font-size: 0.75rem;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #e8eaf0;
    }
    .divider span { padding: 0 12px; }

    .footer-text { color: #9ca3af; font-size: 0.8rem; line-height: 1.6; }
    .footer-text strong { color: #6366f1; }

    .floating-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%; opacity: 0.08; }

    .shape-1 {
      width: 400px; height: 400px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      top: -100px; right: -100px;
      animation: drift 15s ease-in-out infinite;
    }
    .shape-2 {
      width: 300px; height: 300px;
      background: linear-gradient(135deg, #ec4899, #f97316);
      bottom: -80px; left: -80px;
      animation: drift 18s ease-in-out infinite reverse;
    }
    .shape-3 {
      width: 200px; height: 200px;
      background: linear-gradient(135deg, #06b6d4, #10b981);
      top: 50%; left: 50%;
      animation: drift 12s ease-in-out infinite;
    }

    @keyframes drift {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -20px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    @media (max-width: 480px) {
      .login-card { margin: 16px; padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const merID = params['merID'];
      if (token && merID) {
        this.authService.handleAuthCallback(token, merID);
      }
    });

    if (this.authService.isAuthenticated) {
      this.router.navigate(['/chat']);
    }
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
