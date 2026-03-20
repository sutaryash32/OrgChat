import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../core/media.service';
import { Media } from '../../core/models';

@Component({
  selector: 'app-media-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-preview.component.html',
  styleUrl: './media-preview.component.css'
})
export class MediaPreviewComponent implements OnInit {
  mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  media: Media | null = null;
  loading = true;
  error: string | null = null;
  downloadUrl = '';

  get isImage(): boolean {
    return this.mediaService.isImage(this.media?.fileType || '');
  }

  get isVideo(): boolean {
    return this.mediaService.isVideo(this.media?.fileType || '');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadMedia(id);
      }
    });
  }

  loadMedia(id: string): void {
    this.mediaService.getMediaInfo(id).subscribe({
      next: (media) => {
        this.media = media;
        this.downloadUrl = this.mediaService.getDownloadUrl(id);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load media';
        this.loading = false;
      }
    });
  }

  deleteMedia(): void {
    if (this.media?.id && confirm('Delete this media?')) {
      this.mediaService.delete(this.media.id).subscribe({
        next: () => this.router.navigate(['/chat']),
        error: (err) => {
          this.error = 'Failed to delete media';
          console.error('Delete failed:', err);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }
}
