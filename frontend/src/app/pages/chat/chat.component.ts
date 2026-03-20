import { Component, inject, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { UserService } from '../../core/user.service';
import { MediaService } from '../../core/media.service';
import { WebSocketService } from '../../core/websocket.service';
import { Message, User, UserSummary, Media } from '../../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private userService = inject(UserService);
  mediaService = inject(MediaService);  // Public so it can be used in templates
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  currentUser: User | null = null;
  users: UserSummary[] = [];
  filteredUsers: UserSummary[] = [];
  selectedUser: UserSummary | null = null;
  messages: Message[] = [];
  messageContent = '';
  searchQuery = '';
  searchError = false;
  isDarkTheme = true;
  editingMessageId: string | null = null;
  editingContent = '';
  activeMenuMessageId = signal<string | null>(null);
  removingMessageIds = signal(new Set<string>());
  isLoading = signal(false);
  justEditedId = signal<string | null>(null);
  isEditing = computed(() => !!this.editingMessageId);

  // Media and multi-select properties
  mediaCache: Record<string, Media> = {};
  isMultiSelectMode = false;
  selectedRecipients = new Set<string>();
  showToast = false;
  toastMessage = '';
  isUploading = false;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('orgchat_theme');
    if (savedTheme === 'light') {
      this.isDarkTheme = false;
      document.documentElement.classList.add('light-theme');
    } else {
      this.isDarkTheme = true;
      document.documentElement.classList.remove('light-theme');
    }

    this.currentUser = this.authService.currentUser;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.webSocketService.connect();
    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(msg => {
        const isFromMe = msg.senderId === this.currentUser?.merID;
        const otherUserMerID = isFromMe ? msg.recipientId : msg.senderId;

        // Handle different message actions
        if (msg.action === 'EDIT') {
          if (this.selectedUser && this.selectedUser.merID === otherUserMerID) {
            const messageIndex = this.messages.findIndex(m => m.id === msg.id);
            if (messageIndex !== -1) {
              this.messages[messageIndex].content = msg.content;
            }
          }
        } else if (msg.action === 'DELETE') {
          if (this.selectedUser && this.selectedUser.merID === otherUserMerID) {
            this.messages = this.messages.filter(m => m.id !== msg.id);
          }
        } else {
          // 1. Only push to screen if we are currently looking at their chat
          if (this.selectedUser && this.selectedUser.merID === otherUserMerID) {
            this.messages.push(msg);
            // Load media metadata if message has media
            if (msg.mediaId && !this.mediaCache[msg.mediaId]) {
              this.loadMediaForMessage(msg);
            }
          }

          // 2. Dynamically add to sidebar if they aren't there!
          const existingSidebarUser = this.users.find(u => u.merID === otherUserMerID);
          if (!existingSidebarUser) {
            this.userService.getUserByMerID(otherUserMerID).subscribe({
              next: (user) => {
                const summary: UserSummary = {
                  merID: user.merID,
                  displayName: user.displayName,
                  avatarUrl: user.avatarUrl
                };
                this.users.unshift(summary);
                if (!this.searchQuery) {
                  this.filteredUsers = [...this.users];
                }
              },
              error: (err) => console.error('Failed to fetch new sender profile', err)
            });
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketService.disconnect();
  }

  filterUsers(): void {
    this.searchError = false;
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) return;

    // Local check first
    const existing = this.filteredUsers.find(u => u.merID.toLowerCase() === query);
    if (existing) {
      this.selectUser(existing);
      return;
    }

    // Explicit merID search
    this.userService.getUserByMerID(query).subscribe({
      next: (user: User) => {
        const summary: UserSummary = {
          merID: user.merID,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        };
        this.users.unshift(summary);
        this.filteredUsers = [...this.users];
        this.selectUser(summary);
        this.searchQuery = '';
      },
      error: (err: any) => {
        this.searchError = true;
      }
    });
  }

  toggleMultiSelectMode(): void {
    this.isMultiSelectMode = !this.isMultiSelectMode;
    if (this.isMultiSelectMode) {
      this.selectedRecipients.clear();
    }
  }

  toggleRecipient(merID: string): void {
    if (this.selectedRecipients.has(merID)) {
      this.selectedRecipients.delete(merID);
    } else {
      this.selectedRecipients.add(merID);
    }
  }

  isRecipientSelected(merID: string): boolean {
    return this.selectedRecipients.has(merID);
  }

  selectUser(user: UserSummary): void {
    if (this.isMultiSelectMode) {
      // In multi-select mode: toggle recipient instead of switching chat
      this.toggleRecipient(user.merID);
      return;
    }

    // Normal single contact selection
    this.selectedUser = user;
    this.messages = [];
    this.messageContent = '';
    this.isLoading.set(true);
    this.loadConversation();
  }

  loadConversation(): void {
    if (!this.selectedUser || !this.currentUser) return;

    this.chatService.getConversation(this.currentUser.merID, this.selectedUser.merID, 0, 50).subscribe({
      next: (messages) => {
        this.messages = messages;
        // Load media cache for all mediaIds in conversation
        this.loadMediaForMessages(messages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load conversation:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadMediaForMessages(messages: Message[]): void {
    const mediaIds = messages
      .filter(m => m.mediaId && !this.mediaCache[m.mediaId])
      .map(m => m.mediaId as string)
      .filter((id, idx, arr) => arr.indexOf(id) === idx); // Unique IDs

    mediaIds.forEach(id => this.loadMediaForId(id));
  }

  loadMediaForMessage(message: Message): void {
    if (message.mediaId && !this.mediaCache[message.mediaId]) {
      this.loadMediaForId(message.mediaId);
    }
  }

  private loadMediaForId(mediaId: string): void {
    this.mediaService.getMediaById(mediaId).subscribe({
      next: (media) => {
        this.mediaCache[mediaId] = media;
      },
      error: (err) => {
        console.error(`Failed to load media metadata for ${mediaId}:`, err);
      }
    });
  }

  sendMessage(): void {
    if (this.isMultiSelectMode && this.selectedRecipients.size > 0) {
      // Multi-recipient send
      if (!this.messageContent.trim()) return;

      this.chatService.sendToMultiple(
        Array.from(this.selectedRecipients),
        this.messageContent
      ).subscribe({
        next: () => {
          this.showToastMessage(`✓ Sent to ${this.selectedRecipients.size} contacts`);
          this.messageContent = '';
          this.selectedRecipients.clear();
          this.isMultiSelectMode = false;
        },
        error: (err) => console.error('Failed to send multi-message:', err)
      });
    } else if (!this.messageContent.trim() || !this.selectedUser) {
      return;
    } else {
      // Single recipient send
      this.chatService.sendMessage(this.selectedUser.merID, this.messageContent).subscribe({
        next: (message) => {
          this.messages.push(message);
          this.messageContent = '';
        },
        error: (err) => console.error('Failed to send message:', err)
      });
    }
  }

  getMediaCategory(mediaId: string): 'image' | 'video' | 'document' | 'file' | 'loading' {
    if (!mediaId) return 'loading';
    if (!this.mediaCache[mediaId]) return 'loading';
    return this.mediaService.getFileCategory(this.mediaCache[mediaId].fileType);
  }

  getMediaThumbUrl(mediaId: string): string {
    return this.mediaService.getDownloadUrl(mediaId);
  }

  openMedia(mediaId: string): void {
    this.router.navigate(['/media', mediaId]);
  }

  getDocumentIconType(mediaId: string): 'pdf' | 'word' | 'excel' | 'ppt' | 'text' | 'document' {
    if (!this.mediaCache[mediaId]) return 'document';
    return this.mediaService.getDocumentIconType(this.mediaCache[mediaId].fileType);
  }

  getMultiSelectNames(): string {
    return Array.from(this.selectedRecipients)
      .slice(0, 2)
      .map(id => this.users.find(u => u.merID === id)?.displayName || id)
      .join(', ') + (this.selectedRecipients.size > 2 ? `, +${this.selectedRecipients.size - 2} more` : '');
  }

  showToastMessage(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Logout failed:', err)
    });
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.isDarkTheme) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('orgchat_theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('orgchat_theme', 'light');
    }
  }

  startEdit(msg: Message): void {
    this.editingMessageId = msg.id;
    this.messageContent = msg.content;
    this.activeMenuMessageId.set(null);
  }

  editMessage(msg: Message): void {
    this.startEdit(msg);
  }

  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuMessageId.set(this.activeMenuMessageId() === id ? null : id);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.activeMenuMessageId.set(null);
  }

  submitEdit(): void {
    if (!this.editingMessageId || !this.messageContent.trim()) {
      return;
    }

    this.chatService.editMessage(this.editingMessageId, this.messageContent).subscribe({
      next: (updatedMessage) => {
        const messageIndex = this.messages.findIndex(m => m.id === this.editingMessageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].content = updatedMessage.content;
          this.justEditedId.set(updatedMessage.id);
          setTimeout(() => this.justEditedId.set(null), 600);
        }
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Failed to edit message:', err);
        alert('Failed to edit message. You can only edit your own messages.');
      }
    });
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingContent = '';
    this.messageContent = '';
  }

  deleteMessage(id: string): void {
    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      this.activeMenuMessageId.set(null);
      this.removingMessageIds.update((ids) => {
        const next = new Set(ids);
        next.add(id);
        return next;
      });

      // Wait for animation to complete before calling API
      setTimeout(() => {
        this.chatService.deleteMessage(id).subscribe({
          next: () => {
            this.removingMessageIds.update((ids) => {
              const next = new Set(ids);
              next.delete(id);
              return next;
            });
            this.messages = this.messages.filter(m => m.id !== id);
          },
          error: (err) => {
            console.error('Failed to delete message:', err);
            this.removingMessageIds.update((ids) => {
              const next = new Set(ids);
              next.delete(id);
              return next;
            });
            alert('Failed to delete message. You can only delete your own messages.');
          }
        });
      }, 250);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !this.currentUser) {
      target.value = ''; // Reset input
      return;
    }

    // Validate file size (500MB max)
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_SIZE) {
      this.showToastMessage(`❌ File too large (max 500MB)`);
      target.value = '';
      return;
    }

    this.isUploading = true;

    this.mediaService.upload(file, this.currentUser.merID).subscribe({
      next: (media) => {
        this.isUploading = false;
        target.value = ''; // Reset input

        if (this.isMultiSelectMode && this.selectedRecipients.size > 0) {
          // Send to multiple recipients
          this.chatService.sendToMultiple(
            Array.from(this.selectedRecipients),
            '',
            media.id
          ).subscribe({
            next: () => {
              this.showToastMessage(`✓ Shared to ${this.selectedRecipients.size} contacts`);
              this.selectedRecipients.clear();
              this.isMultiSelectMode = false;
            },
            error: (err) => {
              console.error('Failed to send media to multiple recipients:', err);
              this.showToastMessage('❌ Failed to share media');
            }
          });
        } else if (this.selectedUser) {
          // Send to single recipient
          this.chatService.sendMessage(this.selectedUser.merID, '', media.id).subscribe({
            next: (message) => {
              this.messages.push(message);
              // Load media metadata
              if (media.id) {
                this.mediaCache[media.id] = media;
              }
              this.showToastMessage('✓ Media sent');
            },
            error: (err) => {
              console.error('Failed to send media:', err);
              this.showToastMessage('❌ Failed to send media');
            }
          });
        }
      },
      error: (err) => {
        this.isUploading = false;
        target.value = ''; // Reset input
        console.error('Failed to upload file:', err);
        this.showToastMessage('❌ Upload failed');
      }
    });
  }
}

