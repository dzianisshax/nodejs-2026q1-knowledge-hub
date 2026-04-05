import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'New category',
    type: String,
  })
  name: string;
  @ApiProperty({
    description: 'Category description',
    example: 'New description',
    type: String,
  })
  description: string;
}
