import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { UsersService } from '../service/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../roles/roleguard/role.guard';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles('ADMIN') // Only ADMIN can create users
    async createUser(@Body() dto: CreateUserDto) {
        return this.usersService.createUser(dto);
    }

    @Get(':phoneNumber')
    @Roles('USER', 'ADMIN') // Both USER and ADMIN can access this
    async getUser(@Param('phoneNumber') phoneNumber: string, @Req() req) {
        if (req.user.role === 'USER' && req.user.phoneNumber !== phoneNumber) {
            throw new ForbiddenException('Access denied.');
        }
        return this.usersService.getUserByPhone(phoneNumber);
    }

    @Patch(':id')
    @Roles('USER', 'ADMIN')
    async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req) {
        if (req.user.role === 'USER' && req.user.id !== id) {
            throw new ForbiddenException('Access denied.');
        }
        return this.usersService.updateUser(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}
