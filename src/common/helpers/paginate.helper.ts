import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return new PaginatedResponseDto(data, total, page, limit);
}
