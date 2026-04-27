import { Schema } from './ai-response.validator';

export const TRANSLATE_SCHEMA: Schema = {
  translatedText: { type: 'string', required: true },
  detectedLanguage: { type: 'string', required: true },
};

export const ANALYZE_SCHEMA: Schema = {
  analysis: { type: 'string', required: true },
  suggestions: { type: 'array', required: true, items: { type: 'string' } },
  severity: {
    type: 'string',
    required: true,
    enum: ['info', 'warning', 'error'],
  },
};
