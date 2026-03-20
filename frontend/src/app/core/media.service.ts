import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Media } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/media`;

  upload(file: File, uploaderId: string): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  getMediaById(id: string): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/info/${id}`);
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

  getFileCategory(fileType: string): 'image' | 'video' | 'document' | 'file' {
    if (!fileType) return 'file';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (
      fileType.includes('pdf') ||
      fileType.includes('word') ||
      fileType.includes('excel') ||
      fileType.includes('spreadsheet') ||
      fileType.includes('presentation') ||
      fileType.includes('powerpoint') ||
      fileType.includes('document') ||
      fileType.startsWith('text/')
    ) return 'document';
    return 'file';
  }

  getDocumentIconType(fileType: string): 'pdf' | 'word' | 'excel' | 'ppt' | 'text' | 'document' {
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'excel';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'ppt';
    if (fileType.startsWith('text/')) return 'text';
    return 'document';
  }
}

