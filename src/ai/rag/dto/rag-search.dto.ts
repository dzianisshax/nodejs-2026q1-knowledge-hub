import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagSearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ default: 5, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  articleStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}