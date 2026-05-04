export const RAG_PROMPTS = {
  chat: (
    question: string,
    chunks: Array<{ articleTitle: string; chunk: string }>,
    history: Array<{ role: string; text: string }>,
  ): string => {
    const context = chunks
      .map((c, i) => `[Source ${i + 1}] "${c.articleTitle}":\n${c.chunk}`)
      .join('\n\n');

    const historyText = history
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    return `You are a helpful assistant. Answer the question using ONLY the provided context below.
If the answer is not in the context, say "I don't have enough information to answer that."
Always cite the source number(s) you used.

Context:
${context}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}
User question: ${question}

Answer:`;
  },
};