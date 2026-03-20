import { Component, inject, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { UserService } from '../../core/user.service';
import { WebSocketService } from '../../core/websocket.service';
import { Message, User, UserSummary } from '../../core/models';

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
        this.users.unshift(summary); // Add to top of list
        this.filteredUsers = [...this.users];
        this.selectUser(summary);
        this.searchQuery = '';
      },
      error: (err: any) => {
        this.searchError = true;
      }
    });
  }

  selectUser(user: UserSummary): void {
    this.selectedUser = user;
    this.messages = [];
    this.messageContent = '';
    this.isLoading.set(true);

    // The contact-selected class is bound via [class.contact-selected]
    // Angular will re-render and trigger the animation
    this.loadConversation();
  }

  loadConversation(): void {
    if (!this.selectedUser || !this.currentUser) return;

    this.chatService.getConversation(this.currentUser.merID, this.selectedUser.merID, 0, 50).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load conversation:', err);
        this.isLoading.set(false);
      }
    });
  }

  sendMessage(): void {
    if (!this.messageContent.trim() || !this.selectedUser) return;

    this.chatService.sendMessage(this.selectedUser.merID, this.messageContent).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.messageContent = '';
      },
      error: (err) => console.error('Failed to send message:', err)
    });
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
}
