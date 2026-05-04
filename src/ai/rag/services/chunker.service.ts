import { Injectable } from '@nestjs/common';

export interface Chunk {
  text: string;
  index: number;
}

@Injectable()
export class ChunkerService {
  private get chunkSize(): number {
    return parseInt(process.env.RAG_CHUNK_SIZE ?? '800', 10);
  }

  private get chunkOverlap(): number {
    return parseInt(process.env.RAG_CHUNK_OVERLAP ?? '200', 10);
  }

  chunk(text: string): Chunk[] {
    const size = this.chunkSize;
    const overlap = this.chunkOverlap;
    const step = size - overlap;
    const chunks: Chunk[] = [];

    let start = 0;
    let index = 0;

    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      chunks.push({ text: text.slice(start, end), index });
      if (end === text.length) break;
      start += step;
      index++;
    }

    return chunks;
  }
}