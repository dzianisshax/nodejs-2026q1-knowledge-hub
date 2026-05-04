import { Injectable } from '@nestjs/common';

export interface RagMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Injectable()
export class RagConversationService {
  private readonly conversations = new Map<string, RagMessage[]>();

  private get maxMessages(): number {
    return parseInt(process.env.RAG_CONVERSATION_MAX_MESSAGES ?? '20', 10);
  }

  append(
    conversationId: string,
    role: 'user' | 'assistant',
    text: string,
  ): void {
    const history = this.conversations.get(conversationId) ?? [];
    history.push({ role, text });
    if (history.length > this.maxMessages) history.shift();
    this.conversations.set(conversationId, history);
  }

  getHistory(conversationId: string): RagMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  exists(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }
}
