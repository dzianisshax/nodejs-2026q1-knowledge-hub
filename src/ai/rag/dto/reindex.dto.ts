import { IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReindexDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  onlyPublished?: boolean = true;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  articleIds?: string[];
}
