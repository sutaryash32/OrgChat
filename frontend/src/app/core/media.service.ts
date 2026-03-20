import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Media } from './models';

@Injectable({ providedIn: 'root' })
export class MediaService {

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Media>(`${environment.apiUrl}/media/upload`, formData);
  }

  getDownloadUrl(mediaId: string): string {
    return `${environment.apiUrl}/media/download/${mediaId}`;
  }

  delete(mediaId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/media/delete/${mediaId}`);
  }

  getMediaByUser(merID: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${environment.apiUrl}/media/user/${merID}`);
  }

  getMediaById(id: string): Observable<Media> {
    return this.http.get<Media>(`${environment.apiUrl}/media/info/${id}`);
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
