import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { MediaService } from '../../core/media.service';
import { UserService } from '../../core/user.service';
import { WebSocketService } from '../../core/websocket.service';
import { Message, User, Media } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="user-info">
            <div class="avatar">{{ currentUser?.displayName?.charAt(0)?.toUpperCase() || '?' }}</div>
            <div class="user-details">
              <span class="user-name">{{ currentUser?.displayName }}</span>
              <span class="user-merid">{{ currentUser?.merID }}</span>
            </div>
          </div>
          <button class="icon-btn" (click)="logout()" title="Logout" id="logout-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>

        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search contacts..." [(ngModel)]="searchQuery"
                 (input)="filterUsers()" id="search-input"/>
        </div>

        <div class="contacts-list">
          @for (user of filteredUsers; track user.merID) {
            <div class="contact-item" [class.active]="selectedUser?.merID === user.merID"
                 (click)="selectUser(user)" [id]="'contact-' + user.merID">
              <div class="contact-avatar">{{ user.displayName?.charAt(0)?.toUpperCase() }}</div>
              <div class="contact-info">
                <span class="contact-name">{{ user.displayName }}</span>
                <span class="contact-merid">{{ user.merID }}</span>
              </div>
            </div>
          }
          @if (filteredUsers.length === 0) {
            <div class="no-contacts">
              <p>No contacts found</p>
            </div>
          }
        </div>

        <div class="sidebar-nav">
          <button class="nav-btn" [routerLink]="['/profile', currentUser?.merID]" id="nav-profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </button>
          <button class="nav-btn" [routerLink]="['/settings']" id="nav-settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Settings
          </button>
        </div>
      </aside>

      <!-- Chat Area -->
      <main class="chat-area">
        @if (selectedUser) {
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="header-avatar">{{ selectedUser.displayName?.charAt(0)?.toUpperCase() }}</div>
              <div>
                <span class="header-name">{{ selectedUser.displayName }}</span>
                <span class="header-merid">{{ selectedUser.merID }}</span>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-container" #messagesContainer>
            @for (msg of messages; track msg.id) {
              <div class="message" [class.sent]="msg.senderId === currentUser?.merID"
                   [class.received]="msg.senderId !== currentUser?.merID">
                <div class="message-bubble">
                  @if (msg.mediaId) {
                    <div class="message-media" (click)="openMedia(msg.mediaId!)">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>Media attachment</span>
                    </div>
                  }
                  @if (msg.content) {
                    <p class="message-text">{{ msg.content }}</p>
                  }
                  <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                </div>
              </div>
            }
            @if (messages.length === 0) {
              <div class="empty-chat">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>Start a conversation with {{ selectedUser.displayName }}</p>
              </div>
            }
          </div>

          <!-- Input Area -->
          <div class="input-area">
            <button class="icon-btn attach-btn" (click)="fileInput.click()" title="Attach file" id="attach-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <input type="file" #fileInput (change)="onFileSelected($event)" style="display:none"/>

            @if (selectedFile) {
              <div class="file-preview">
                <span>📎 {{ selectedFile.name }}</span>
                <button class="remove-file" (click)="removeFile()">✕</button>
              </div>
            }

            <input type="text" class="message-input" placeholder="Type a message..."
                   [(ngModel)]="messageText" (keyup.enter)="sendMessage()" id="message-input"/>
            <button class="send-btn" (click)="sendMessage()" [disabled]="!messageText && !selectedFile" id="send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        } @else {
          <!-- No chat selected -->
          <div class="no-chat-selected">
            <div class="no-chat-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h2>Welcome to OrgChat</h2>
            <p>Select a contact to start chatting</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .chat-layout {
      display: flex; height: 100vh;
      background: #f5f6fa; color: #1a1a2e;
      font-family: 'Inter', sans-serif;
    }

    .sidebar {
      width: 320px; background: #ffffff;
      border-right: 1px solid #e8eaf0;
      display: flex; flex-direction: column;
      box-shadow: 2px 0 12px rgba(0,0,0,0.04);
    }

    .sidebar-header {
      padding: 20px; display: flex; align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e8eaf0;
    }

    .user-info { display: flex; align-items: center; gap: 12px; }

    .avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 1rem; color: #fff;
    }

    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; font-size: 0.9rem; color: #1a1a2e; }
    .user-merid { color: #9ca3af; font-size: 0.75rem; }

    .icon-btn {
      background: none; border: none; color: #9ca3af;
      cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s;
    }
    .icon-btn:hover { color: #1a1a2e; background: #f0f1f5; }

    .search-box {
      margin: 16px 20px; display: flex; align-items: center; gap: 8px;
      background: #f0f1f5; border-radius: 10px;
      padding: 10px 14px; border: 1px solid #e8eaf0;
    }
    .search-box svg { color: #9ca3af; flex-shrink: 0; }
    .search-box input {
      background: none; border: none; outline: none;
      color: #1a1a2e; font-size: 0.85rem; width: 100%;
      font-family: 'Inter', sans-serif;
    }
    .search-box input::placeholder { color: #9ca3af; }

    .contacts-list { flex: 1; overflow-y: auto; padding: 0 8px; }

    .contact-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s; margin-bottom: 2px;
    }
    .contact-item:hover { background: #f0f1f5; }
    .contact-item.active { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); }

    .contact-avatar {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; color: #fff; flex-shrink: 0;
    }

    .contact-info { display: flex; flex-direction: column; min-width: 0; }
    .contact-name { font-weight: 500; font-size: 0.9rem; color: #1a1a2e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .contact-merid { color: #9ca3af; font-size: 0.75rem; }

    .no-contacts { text-align: center; padding: 40px 0; color: #9ca3af; }

    .sidebar-nav {
      padding: 12px; border-top: 1px solid #e8eaf0;
      display: flex; gap: 8px;
    }

    .nav-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; border: none; border-radius: 10px;
      background: #f0f1f5; color: #6b7280;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
      font-family: 'Inter', sans-serif; text-decoration: none;
    }
    .nav-btn:hover { background: #e5e7eb; color: #1a1a2e; }

    /* Chat Area */
    .chat-area { flex: 1; display: flex; flex-direction: column; background: #fafbfc; }

    .chat-header {
      padding: 16px 24px; border-bottom: 1px solid #e8eaf0;
      background: #ffffff;
    }

    .chat-header-info { display: flex; align-items: center; gap: 12px; }

    .header-avatar {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; color: #fff;
    }
    .header-name { font-weight: 600; font-size: 0.95rem; display: block; color: #1a1a2e; }
    .header-merid { color: #9ca3af; font-size: 0.75rem; }

    /* Messages */
    .messages-container {
      flex: 1; overflow-y: auto; padding: 20px 24px;
      display: flex; flex-direction: column; gap: 8px;
    }

    .message { display: flex; }
    .message.sent { justify-content: flex-end; }
    .message.received { justify-content: flex-start; }

    .message-bubble {
      max-width: 65%; padding: 12px 16px; border-radius: 16px;
      animation: msgIn 0.3s ease-out;
    }

    @keyframes msgIn {
      from { opacity: 0; transform: translateY(10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sent .message-bubble {
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      color: #fff; border-bottom-right-radius: 4px;
    }

    .received .message-bubble {
      background: #ffffff; color: #1a1a2e;
      border: 1px solid #e8eaf0; border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .message-text { margin: 0; font-size: 0.9rem; line-height: 1.5; word-break: break-word; }
    .message-time {
      display: block; font-size: 0.65rem; margin-top: 4px;
      opacity: 0.6; text-align: right;
    }

    .message-media {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; background: rgba(99,102,241,0.1);
      border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: background 0.2s;
    }
    .message-media:hover { background: rgba(99,102,241,0.2); }
    .message-media span { font-size: 0.8rem; }

    .empty-chat {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #9ca3af; gap: 12px;
    }
    .empty-chat p { margin: 0; }

    /* Input Area */
    .input-area {
      padding: 16px 24px; border-top: 1px solid #e8eaf0;
      display: flex; align-items: center; gap: 12px;
      background: #ffffff;
    }

    .message-input {
      flex: 1; padding: 12px 16px; border: 1px solid #e0e2e8;
      border-radius: 12px; background: #f5f6fa;
      color: #1a1a2e; font-size: 0.9rem; outline: none;
      transition: border-color 0.2s; font-family: 'Inter', sans-serif;
    }
    .message-input:focus { border-color: rgba(99,102,241,0.5); background: #fff; }
    .message-input::placeholder { color: #9ca3af; }

    .send-btn {
      width: 44px; height: 44px; border: none; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      color: #fff; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all 0.2s;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .file-preview {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; background: rgba(99,102,241,0.1);
      border-radius: 8px; font-size: 0.8rem; color: #6366f1;
    }
    .remove-file {
      background: none; border: none; color: #9ca3af;
      cursor: pointer; font-size: 0.9rem;
    }

    .attach-btn { flex-shrink: 0; }

    /* No chat selected */
    .no-chat-selected {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #9ca3af; gap: 8px;
    }
    .no-chat-icon { opacity: 0.2; animation: float 3s ease-in-out infinite; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
    .no-chat-selected h2 { color: #6b7280; font-weight: 600; margin: 0; }
    .no-chat-selected p { margin: 0; }

    @media (max-width: 768px) {
      .sidebar { width: 72px; overflow: hidden; }
      .sidebar-header .user-details,
      .search-box, .contact-info, .sidebar-nav span { display: none; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  currentUser: User | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  messages: Message[] = [];
  messageText = '';
  searchQuery = '';
  selectedFile: File | null = null;

  private wsSub?: Subscription;
  private userSub?: Subscription;
  private shouldScroll = false;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private mediaService: MediaService,
    private userService: UserService,
    private wsService: WebSocketService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.loadUsers();
    this.wsService.connect();
    this.wsSub = this.wsService.messages$.subscribe(msg => {
      if (this.selectedUser &&
          (msg.senderId === this.selectedUser.merID || msg.recipientId === this.selectedUser.merID)) {
        this.messages.push(msg);
        this.shouldScroll = true;
      }
    });

    // Handle route parameter :merID (if user navigates to /chat/:merID)
    this.route.paramMap.subscribe(params => {
      const recipientMerID = params.get('merID');
      if (recipientMerID) {
        this.chatService.startChat(recipientMerID).subscribe({
          next: (user) => this.selectUser(user),
          error: (err) => console.error('Failed to start chat:', err)
        });
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.wsService.disconnect();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.merID !== this.currentUser?.merID);
        this.filteredUsers = [...this.users];
      },
      error: () => { this.filteredUsers = []; }
    });
  }

  filterUsers(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.displayName?.toLowerCase().includes(q) || u.merID?.toLowerCase().includes(q));
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.messages = [];
    this.chatService.getConversation(user.merID).subscribe({
      next: (page) => {
        this.messages = page.content.reverse();
        this.shouldScroll = true;
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedUser || (!this.messageText.trim() && !this.selectedFile)) return;

    const send = (mediaId?: string) => {
      this.chatService.sendMessage(
        this.selectedUser!.merID, this.messageText.trim(), mediaId
      ).subscribe({
        next: (msg) => {
          this.messages.push(msg);
          this.messageText = '';
          this.selectedFile = null;
          this.shouldScroll = true;
        }
      });
    };

    if (this.selectedFile) {
      this.mediaService.upload(this.selectedFile).subscribe({
        next: (media) => send(media.id)
      });
    } else {
      send();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void { this.selectedFile = null; }

  openMedia(mediaId: string): void {
    this.router.navigate(['/media', mediaId]);
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  logout(): void { this.authService.logout(); }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
