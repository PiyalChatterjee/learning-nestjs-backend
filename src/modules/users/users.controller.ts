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
import { ApiQuery, ApiTags, ApiBody, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Exposes user management endpoints.
 */
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

  /**
   * Returns paginated users.
   */
  @Get()
  @ApiOperation({ summary: 'Get all users with optional pagination' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved users with pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users to return per page',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number to return',
  })
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

  /**
   * Returns a single user by id.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1234,
    description: 'ID of the user to return',
  })
  public getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  /**
   * Creates a new user.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'Successfully created a new user' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateUserDto, description: 'Data transfer object for creating a new user' })
  public createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  /**
   * Replaces user fields with a full update payload.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({ status: 200, description: 'Successfully updated the user' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: UpdateUserDto, description: 'Data transfer object for updating an existing user' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1234,
    description: 'ID of the user to update',
  })
  public updateUser(
    @Body() dto: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.updateUser(id, dto);
  }
  
  /**
   * Applies partial updates to a user.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an existing user' })
  @ApiResponse({ status: 200, description: 'Successfully partially updated the user' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: PatchUserDto, description: 'Data transfer object for partially updating an existing user' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1234,
    description: 'ID of the user to partially update',
  })
  public partiallyUpdateUser(
    @Body() dto: PatchUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.patchUser(id, dto);
  }
  
  /**
   * Deletes a user by id.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an existing user' })
  @ApiResponse({ status: 200, description: 'Successfully deleted the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1234,
    description: 'ID of the user to delete',
  })
  public deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
