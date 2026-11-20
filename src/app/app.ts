import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewChecked {
  private http = inject(HttpClient);
  
  private n8nWebhookUrl = 'https://rubs.app.n8n.cloud/webhook/chat';
  
  // Identificador de sesión para que la memoria de n8n recuerde el contexto
  private sessionId = 'session_' + Math.random().toString(36).substring(2, 9);

  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  isDarkMode = signal(true);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  send() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    const history = this.messages();

    this.userInput.set('');
    this.isLoading.set(true);

    this.http.post<any>(this.n8nWebhookUrl, { 
      message: text,
      sessionId: this.sessionId
    }).subscribe({
      next: (res) => {
        const assistantContent = res?.content || res?.output || (typeof res === 'string' ? res : JSON.stringify(res));
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: assistantContent }]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al conectar con n8n:', err);
        const errorMsg = err.status === 0 
          ? 'Error de conexión / CORS. Asegúrate de que el webhook esté activo o publicado en n8n.'
          : `Error al conectar con n8n (${err.status}: ${err.statusText || 'Error desconocido'})`;
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: errorMsg }]);
        this.isLoading.set(false);
      }
    });
  }
}