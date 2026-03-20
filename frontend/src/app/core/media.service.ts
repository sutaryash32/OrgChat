import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Media } from './models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/media';

  upload(file: File, uploaderId: string): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  getMediaInfo(id: string): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/info/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${this.apiUrl}/download/${id}`;
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getUserMedia(merID: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/user/${merID}`);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isImage(fileType: string): boolean {
    return fileType?.startsWith('image/') ?? false;
  }

  isVideo(fileType: string): boolean {
    return fileType?.startsWith('video/') ?? false;
  }
}
