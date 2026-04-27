export const PROMPTS = {
  summarize: (content: string, maxLength: 'short' | 'medium' | 'detailed') => {
    const lengthGuide = {
      short: '1-2 sentences',
      medium: '1 paragraph (3-5 sentences)',
      detailed: '3-5 paragraphs',
    }[maxLength];

    return `Summarize the following article content in ${lengthGuide}. Return only the summary text, no preamble.

    Article:
    ${content}`;
  },

  translate: (
    content: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ) => {
    const sourcePart = sourceLanguage
      ? `from ${sourceLanguage}`
      : 'detecting the source language automatically';

    return `Translate the following article content ${sourcePart} to ${targetLanguage}.

        Return a JSON object with exactly this shape:
        {
        "translatedText": "<full translated content>",
        "detectedLanguage": "<ISO 639-1 language code of the source language>"
        }

        Article:
        ${content}`;
  },

  analyze: (
    content: string,
    task: 'review' | 'bugs' | 'optimize' | 'explain',
  ) => {
    const taskGuide = {
      review: 'Review this article for clarity, accuracy, and quality.',
      bugs: 'Identify any factual errors, logical inconsistencies, or technical inaccuracies.',
      optimize: 'Suggest improvements to structure, readability, and SEO.',
      explain: 'Explain the key concepts in this article in simple terms.',
    }[task];

    return `${taskGuide}

    Return a JSON object with exactly this shape:
    {
    "analysis": "<main analysis text>",
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "..."],
    "severity": "<info|warning|error>"
    }

    Article:
    ${content}`;
  },

  generate: (
    prompt: string,
    history: Array<{ role: string; text: string }>,
  ) => {
    const historyText = history
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    return historyText
      ? `Previous conversation:\n${historyText}\n\nUser: ${prompt}`
      : prompt;
  },
};
