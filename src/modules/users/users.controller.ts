import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { PatchUserDto } from './dtos/patch-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './provider/users.service';

@Controller('users')
export class UsersController {
  // Inject UsersService to handle business logic
  constructor(private readonly usersService: UsersService) {}
  /*
   * COURSE TEMPLATE: GET users endpoint progression
   *
   * Final endpoint target:
   * - /users/:id?limit=10&page=1
   *
   * Rules:
   * - Param id: optional, parse to integer, no default value
   * - Query limit: integer, default 10
   * - Query page: integer, default 1
   *
   * Use cases:
   * - /users -> return all users with default pagination
   * - /users/1234 -> return one user whose id is 1234
   * - /users?limit=10&page=2 -> return page 2 with limit 10
   *
   * Nest note:
   * - In practice, keep two handlers for clarity:
   *   1) GET /users
   *   2) GET /users/:id
   * - Shared pagination logic can live in service methods.
   *
   * Uncomment and adapt as you progress:
   *
   * // @Get()
   * // getUsers(
   * //   @Query('limit') limit = '10',
   * //   @Query('page') page = '1',
   * // ) {
   * //   const parsedLimit = Number(limit);
   * //   const parsedPage = Number(page);
   * //   return { mode: 'all', limit: parsedLimit, page: parsedPage };
   * // }
   *
   * // @Get(':id')
   * // getUserById(
   * //   @Param('id') id: string,
   * //   @Query('limit') limit = '10',
   * //   @Query('page') page = '1',
   * // ) {
   * //   const parsedId = Number(id);
   * //   const parsedLimit = Number(limit);
   * //   const parsedPage = Number(page);
   * //   return { mode: 'single', id: parsedId, limit: parsedLimit, page: parsedPage };
   * // }
   */

  @Get()
  public getAllUsers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    const parsedLimit = Number(limit);
    const parsedPage = Number(page);
    console.log(
      `Fetching users with limit ${parsedLimit} and page ${parsedPage}`,
    );
    return this.usersService.getAllUsers(parsedLimit, parsedPage);
  }
  @Get(':id')
  public getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }
  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
  @Put(':id')
  public updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }
  @Patch(':id')
  public partiallyUpdateUser(
    @Body() partiallyUpdateUserDto: PatchUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.patchUser(id, partiallyUpdateUserDto);
  }
  @Delete(':id')
  public deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
