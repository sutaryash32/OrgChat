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
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUsers();
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

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.merID !== this.currentUser?.merID);
        this.filteredUsers = [...this.users];
      },
      error: (err) => console.error('Failed to load users:', err)
    });
  }

  filterUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(u =>
        u.displayName.toLowerCase().includes(query) ||
        u.merID.toLowerCase().includes(query)
      );
    }
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
