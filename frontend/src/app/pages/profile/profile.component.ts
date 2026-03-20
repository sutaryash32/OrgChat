import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/user.service';
import { MediaService } from '../../core/media.service';
import { User, Media } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <button class="back-btn" (click)="goBack()" id="profile-back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      @if (user) {
        <div class="profile-card">
          <div class="profile-avatar">{{ user.displayName?.charAt(0)?.toUpperCase() }}</div>
          <h1 class="profile-name">{{ user.displayName }}</h1>
          <p class="profile-merid">&#64;{{ user.merID }}</p>
          <p class="profile-email">{{ user.email }}</p>
          <div class="profile-badges">
            <span class="badge role-badge">{{ user.role }}</span>
            @if (user.ssoProvider) {
              <span class="badge sso-badge">{{ user.ssoProvider }} SSO</span>
            }
          </div>
        </div>

        <div class="media-section">
          <h2>Media History</h2>
          <div class="media-grid">
            @for (item of mediaHistory; track item.id) {
              <div class="media-card">
                @if (isImage(item)) {
                  <img [src]="getDownloadUrl(item.id)" [alt]="item.fileName" class="media-thumb"/>
                } @else {
                  <div class="media-file-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                }
                <div class="media-card-info">
                  <span class="media-name">{{ item.fileName }}</span>
                  <span class="media-size">{{ formatFileSize(item.fileSize) }}</span>
                </div>
              </div>
            }
            @if (mediaHistory.length === 0) {
              <p class="no-media">No media shared yet.</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh; background: #0f0f17; color: #e0e0e0;
      font-family: 'Inter', sans-serif; padding: 24px;
    }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: rgba(255,255,255,0.6);
      cursor: pointer; font-size: 0.85rem; padding: 8px 12px;
      border-radius: 8px; transition: all 0.2s; margin-bottom: 24px;
      font-family: 'Inter', sans-serif;
    }
    .back-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

    .profile-card {
      text-align: center; padding: 40px;
      background: rgba(255,255,255,0.03); border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.06);
      max-width: 500px; margin: 0 auto 32px;
      animation: fadeIn 0.5s ease;
    }

    .profile-avatar {
      width: 80px; height: 80px; border-radius: 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 700; color: #fff;
      margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(99,102,241,0.3);
    }

    .profile-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
    .profile-merid { color: rgba(129,140,248,0.8); margin: 0 0 4px; font-size: 0.9rem; }
    .profile-email { color: rgba(255,255,255,0.4); margin: 0 0 16px; font-size: 0.85rem; }

    .profile-badges { display: flex; gap: 8px; justify-content: center; }
    .badge {
      padding: 4px 12px; border-radius: 20px; font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
    }
    .role-badge { background: rgba(99,102,241,0.15); color: #818cf8; }
    .sso-badge { background: rgba(16,185,129,0.15); color: #34d399; }

    .media-section {
      max-width: 800px; margin: 0 auto;
    }
    .media-section h2 {
      font-size: 1.1rem; font-weight: 600; margin: 0 0 16px;
      color: rgba(255,255,255,0.7);
    }

    .media-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .media-card {
      background: rgba(255,255,255,0.03); border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06); overflow: hidden;
      transition: transform 0.2s;
    }
    .media-card:hover { transform: translateY(-4px); }

    .media-thumb { width: 100%; height: 140px; object-fit: cover; }

    .media-file-icon {
      height: 140px; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.2);
    }

    .media-card-info { padding: 12px; }
    .media-name { display: block; font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .media-size { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

    .no-media { color: rgba(255,255,255,0.3); text-align: center; grid-column: 1 / -1; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  mediaHistory: Media[] = [];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userService.getUserByMerID(id).subscribe({
        next: (user) => this.user = user
      });
      this.mediaService.getMediaByUser(id).subscribe({
        next: (media) => this.mediaHistory = media,
        error: () => this.mediaHistory = []
      });
    }
  }

  isImage(media: Media): boolean { return this.mediaService.isImage(media.fileType); }

  getDownloadUrl(id: string): string { return this.mediaService.getDownloadUrl(id); }

  formatFileSize(bytes: number): string { return this.mediaService.formatFileSize(bytes); }

  goBack(): void { window.history.back(); }
}
