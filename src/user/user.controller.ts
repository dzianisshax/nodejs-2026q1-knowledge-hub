import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { validate as isUuid } from 'uuid';
import { ApiOkResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  @HttpCode(HttpStatus.OK)
  findAll() {
    const users = this.userService.findAll();
    return UserResponseDto.fromEntities(users);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    const user = this.userService.create(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updatedUser = this.userService.update(id, updatePasswordDto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`userId ${id} is invalid (not uuid)`);
    }

    const user = this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.userService.delete(id);
  }
}
