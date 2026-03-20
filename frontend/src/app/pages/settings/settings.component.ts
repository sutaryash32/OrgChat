import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <button class="back-btn" (click)="goBack()" id="settings-back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <h1>Settings</h1>

      <!-- Account Settings -->
      <section class="settings-section">
        <h2>Account</h2>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Display Name</span>
              <span class="setting-value">{{ currentUser?.displayName }}</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">merID</span>
              <span class="setting-value id-value">{{ currentUser?.merID }}</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Email</span>
              <span class="setting-value">{{ currentUser?.email }}</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Role</span>
              <span class="setting-value">{{ currentUser?.role }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Security -->
      <section class="settings-section">
        <h2>Security</h2>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Authentication</span>
              <span class="setting-value">Google SSO ({{ currentUser?.ssoProvider }})</span>
            </div>
            <span class="badge secure-badge">Secure</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Session</span>
              <span class="setting-value">Active — JWT Token</span>
            </div>
            <button class="danger-btn" (click)="logout()" id="settings-logout-btn">Log Out</button>
          </div>
        </div>
      </section>

      <!-- About -->
      <section class="settings-section">
        <h2>About OrgChat</h2>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Version</span>
              <span class="setting-value">1.0.0</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Stack</span>
              <span class="setting-value">Angular + Spring Boot + MongoDB</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh; background: #0f0f17; color: #e0e0e0;
      font-family: 'Inter', sans-serif; padding: 24px;
      max-width: 640px; margin: 0 auto;
    }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: rgba(255,255,255,0.6);
      cursor: pointer; font-size: 0.85rem; padding: 8px 12px;
      border-radius: 8px; transition: all 0.2s; margin-bottom: 16px;
      font-family: 'Inter', sans-serif;
    }
    .back-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

    h1 {
      font-size: 1.8rem; font-weight: 700; margin: 0 0 32px;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .settings-section { margin-bottom: 28px; }
    .settings-section h2 {
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1px; color: rgba(255,255,255,0.4); margin: 0 0 12px;
    }

    .settings-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; overflow: hidden;
    }

    .setting-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .setting-row:last-child { border-bottom: none; }

    .setting-info { display: flex; flex-direction: column; gap: 2px; }
    .setting-label { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
    .setting-value { font-size: 0.9rem; font-weight: 500; }
    .id-value { color: #818cf8; font-family: monospace; }

    .badge {
      padding: 4px 12px; border-radius: 20px; font-size: 0.7rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .secure-badge { background: rgba(16,185,129,0.15); color: #34d399; }

    .danger-btn {
      padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.2);
      background: rgba(239,68,68,0.1); color: #f87171; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
    }
    .danger-btn:hover { background: rgba(239,68,68,0.2); }
  `]
})
export class SettingsComponent {
  currentUser: User | null;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.currentUser;
  }

  logout(): void { this.authService.logout(); }

  goBack(): void { window.history.back(); }
}
