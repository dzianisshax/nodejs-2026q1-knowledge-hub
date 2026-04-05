import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'New category',
    type: String,
  })
  name?: string;
  @ApiPropertyOptional({
    description: 'Category description',
    example: 'New description',
    type: String,
  })
  description?: string;
}
