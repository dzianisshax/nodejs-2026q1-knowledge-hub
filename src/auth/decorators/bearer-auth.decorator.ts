import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export const BearerAuth = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
  );
