import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../core/media.service';
import { Media } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-media-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <div class="preview-header">
        <button class="back-btn" (click)="goBack()" id="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <h2>{{ media?.fileName }}</h2>
        <div class="header-actions">
          <a [href]="downloadUrl" class="action-btn download-btn" download id="download-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </a>
          <button class="action-btn delete-btn" (click)="deleteMedia()" id="delete-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div class="preview-content">
        @if (loading) {
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading media...</p>
          </div>
        } @else if (media) {
          @if (isImage) {
            <img [src]="downloadUrl" [alt]="media.fileName" class="preview-image"/>
          } @else if (isVideo) {
            <video [src]="downloadUrl" controls class="preview-video"></video>
          } @else {
            <div class="file-icon-large">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p class="file-name">{{ media.fileName }}</p>
              <p class="file-details">
                {{ media.fileType }} · {{ mediaService.formatFileSize(media.fileSize) }}
              </p>
            </div>
          }

          <div class="media-info">
            <div class="info-item">
              <span class="label">File Name</span>
              <span class="value">{{ media.fileName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type</span>
              <span class="value">{{ media.fileType }}</span>
            </div>
            <div class="info-item">
              <span class="label">Size</span>
              <span class="value">{{ mediaService.formatFileSize(media.fileSize) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Uploaded</span>
              <span class="value">{{ media.timestamp | date:'medium' }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      min-height: 100vh;
      background: #0f0f17;
      color: #e0e0e0;
      font-family: 'Inter', sans-serif;
    }

    .preview-header {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }

    .preview-header h2 { flex: 1; margin: 0; font-size: 1rem; font-weight: 500; }

    .back-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; color: rgba(255,255,255,0.6);
      cursor: pointer; font-size: 0.85rem; padding: 8px 12px;
      border-radius: 8px; transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .back-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

    .header-actions { display: flex; gap: 8px; }

    .action-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s; border: none;
      font-family: 'Inter', sans-serif; text-decoration: none;
    }

    .download-btn {
      background: rgba(99,102,241,0.15); color: #818cf8;
      border: 1px solid rgba(99,102,241,0.2);
    }
    .download-btn:hover { background: rgba(99,102,241,0.25); }

    .delete-btn {
      background: rgba(239,68,68,0.1); color: #f87171;
      border: 1px solid rgba(239,68,68,0.15);
    }
    .delete-btn:hover { background: rgba(239,68,68,0.2); }

    .preview-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 24px; gap: 32px;
    }

    .preview-image {
      max-width: 90%; max-height: 60vh; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: fadeIn 0.5s ease;
    }

    .preview-video {
      max-width: 90%; max-height: 60vh; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }

    .file-icon-large {
      text-align: center; padding: 40px;
      background: rgba(255,255,255,0.03); border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .file-icon-large svg { color: rgba(255,255,255,0.2); }
    .file-name { font-weight: 600; margin: 16px 0 4px; }
    .file-details { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0; }

    .media-info {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px; width: 100%; max-width: 600px;
      padding: 24px; background: rgba(255,255,255,0.03);
      border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);
    }

    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .label { color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 0.9rem; }

    .loading-spinner {
      display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2);
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class MediaPreviewComponent implements OnInit {
  media: Media | null = null;
  loading = true;
  downloadUrl = '';

  get isImage(): boolean { return this.mediaService.isImage(this.media?.fileType || ''); }
  get isVideo(): boolean { return this.mediaService.isVideo(this.media?.fileType || ''); }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public mediaService: MediaService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.downloadUrl = this.mediaService.getDownloadUrl(id);
      // We need media metadata — fetch from the media list or a separate endpoint
      this.loading = false;
      this.media = {
        id, uploaderId: '', fileName: 'Media File', fileType: 'unknown',
        fileSize: 0, storagePath: '', timestamp: new Date().toISOString()
      };
    }
  }

  deleteMedia(): void {
    if (this.media && confirm('Are you sure you want to delete this file?')) {
      this.mediaService.delete(this.media.id).subscribe({
        next: () => this.router.navigate(['/chat']),
        error: () => alert('Could not delete — only the uploader can delete this file.')
      });
    }
  }

  goBack(): void {
    window.history.back();
  }
}
