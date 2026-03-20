import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../core/media.service';
import { Media } from '../../core/models';

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
        } @else if (error) {
          <div class="error-state">
            <p>{{ error }}</p>
            <button class="back-btn" (click)="goBack()">Go Back</button>
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
      min-height: 100vh; background: #f5f6fa; color: #1a1a2e;
      font-family: 'Inter', sans-serif;
    }

    .preview-header {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 24px; border-bottom: 1px solid #e8eaf0;
      background: #ffffff;
    }
    .preview-header h2 { flex: 1; margin: 0; font-size: 1rem; font-weight: 500; }

    .back-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; color: #9ca3af;
      cursor: pointer; font-size: 0.85rem; padding: 8px 12px;
      border-radius: 8px; transition: all 0.2s; font-family: 'Inter', sans-serif;
    }
    .back-btn:hover { color: #1a1a2e; background: #f0f1f5; }

    .header-actions { display: flex; gap: 8px; }

    .action-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s; border: none;
      font-family: 'Inter', sans-serif; text-decoration: none;
    }
    .download-btn {
      background: rgba(99,102,241,0.08); color: #6366f1;
      border: 1px solid rgba(99,102,241,0.15);
    }
    .download-btn:hover { background: rgba(99,102,241,0.15); }
    .delete-btn {
      background: rgba(239,68,68,0.05); color: #dc2626;
      border: 1px solid rgba(239,68,68,0.1);
    }
    .delete-btn:hover { background: rgba(239,68,68,0.1); }

    .preview-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 24px; gap: 32px;
    }

    .preview-image {
      max-width: 90%; max-height: 60vh; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      animation: fadeIn 0.5s ease;
    }
    .preview-video {
      max-width: 90%; max-height: 60vh; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }

    .file-icon-large {
      text-align: center; padding: 40px;
      background: #ffffff; border-radius: 20px;
      border: 1px solid #e8eaf0; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }
    .file-icon-large svg { color: #d1d5db; }
    .file-name { font-weight: 600; margin: 16px 0 4px; color: #1a1a2e; }
    .file-details { color: #9ca3af; font-size: 0.85rem; margin: 0; }

    .media-info {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px; width: 100%; max-width: 600px;
      padding: 24px; background: #ffffff;
      border-radius: 16px; border: 1px solid #e8eaf0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .label { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 0.9rem; color: #1a1a2e; }

    .loading-spinner {
      display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0;
      color: #9ca3af;
    }
    .error-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      color: #dc2626; background: #ffffff; border: 1px solid #fecaca;
      border-radius: 12px; padding: 20px 24px;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.15);
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
  error: string | null = null;
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
    if (!id) {
      this.error = 'Invalid media id.';
      this.loading = false;
      return;
    }

    this.downloadUrl = this.mediaService.getDownloadUrl(id);
    this.mediaService.getMediaById(id).subscribe({
      next: (media) => {
        this.media = media;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.status === 404
          ? 'Media not found.'
          : 'Failed to load media metadata.';
        this.loading = false;
      }
    });
  }

  deleteMedia(): void {
    if (this.media && confirm('Are you sure you want to delete this file?')) {
      this.mediaService.delete(this.media.id).subscribe({
        next: () => this.router.navigate(['/chat']),
        error: () => alert('Could not delete — only the uploader can delete this file.')
      });
    }
  }

  goBack(): void { window.history.back(); }
}
