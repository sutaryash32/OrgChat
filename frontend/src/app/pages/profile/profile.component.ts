import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/user.service';
import { MediaService } from '../../core/media.service';
import { User, Media } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  user: User | null = null;
  media: Media[] = [];
  loading = true;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const merID = params['merID'];
      if (merID) {
        this.loadProfile(merID);
      }
    });
  }

  loadProfile(merID: string): void {
    this.userService.getUserByMerID(merID).subscribe({
      next: (user) => {
        this.user = user;
        this.loadMedia(merID);
      },
      error: () => this.router.navigate(['/chat'])
    });
  }

  loadMedia(merID: string): void {
    this.mediaService.getUserMedia(merID).subscribe({
      next: (media) => {
        this.media = media;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }
}
