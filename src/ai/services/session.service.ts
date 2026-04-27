import { Injectable } from '@nestjs/common';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, Message[]>();
  private readonly maxHistory = 10;

  append(sessionId: string, role: 'user' | 'assistant', text: string): void {
    const history = this.sessions.get(sessionId) ?? [];
    history.push({ role, text });
    if (history.length > this.maxHistory) history.shift();
    this.sessions.set(sessionId, history);
  }

  getHistory(sessionId: string): Message[] {
    return this.sessions.get(sessionId) ?? [];
  }
}
