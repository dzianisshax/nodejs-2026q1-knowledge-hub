import { Injectable, Logger } from '@nestjs/common';

export interface RagMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

@Injectable()
export class RagConversationService {
  private readonly logger = new Logger(RagConversationService.name);
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

    history.push({ role, text, timestamp: Date.now() });

    // Sliding window — drop oldest message when cap is exceeded
    while (history.length > this.maxMessages) {
      history.shift();
    }

    this.conversations.set(conversationId, history);
    this.logger.debug(
      `Conversation ${conversationId}: ${history.length}/${this.maxMessages} messages`,
    );
  }

  getHistory(conversationId: string): RagMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  exists(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }

  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
    this.logger.debug(`Cleared conversation ${conversationId}`);
  }

  stats() {
    return {
      activeSessions: this.conversations.size,
      maxMessagesPerSession: this.maxMessages,
      sessions: [...this.conversations.entries()].map(([id, msgs]) => ({
        conversationId: id,
        messageCount: msgs.length,
        oldestMessageAt: msgs[0]?.timestamp ?? null,
        latestMessageAt: msgs[msgs.length - 1]?.timestamp ?? null,
      })),
    };
  }
}
