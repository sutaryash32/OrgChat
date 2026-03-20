import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.webSocketService.connect();
    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(msg => {
        this.messages.push(msg);
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
        if (user.merID === this.currentUser?.merID) {
          this.searchError = true;
          return;
        }
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
    this.loadConversation();
  }

  loadConversation(): void {
    if (!this.selectedUser || !this.currentUser) return;

    this.chatService.getConversation(this.currentUser.merID, this.selectedUser.merID, 0, 50).subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: (err) => console.error('Failed to load conversation:', err)
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
}
