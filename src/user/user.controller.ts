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
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';

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
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
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
  ) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updatedUser = await this.userService.update(id, updatePasswordDto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return await this.userService.delete(id);
  }
}
