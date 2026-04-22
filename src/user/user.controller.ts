import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BearerAuth } from '../auth/decorators/bearer-auth.decorator';
import * as bcrypt from 'bcryptjs';
import { ForbiddenError, NotFoundError } from '../common/errors/app-errors';

@BearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() pagination: PaginationQueryDto) {
    const paginated = await this.userService.findAll(
      pagination.page,
      pagination.limit,
    );
    return UserResponseDto.fromPaginated(paginated);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    // Only the user themselves or an admin can change the password
    if (currentUser.userId !== id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('You can only change your own password');
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenError('Old password is incorrect');
    }

    const updatedUser = await this.userService.update(id, updatePasswordDto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return await this.userService.delete(id);
  }
}
