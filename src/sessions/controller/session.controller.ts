import { Controller, Get, Delete, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/roles/roleguard/role.guard';
import { SessionsService } from '../service/session.service';


@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get('me')
  @Roles('USER', 'ADMIN')
  async mySessions(@Req() req) {
    return this.sessions.listUserSessions(req.user.userId);
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN')
  async revoke(@Param('id') id: string, @Req() req) {
    await this.sessions.revokeSession(id);
    return { success: true };
  }
}
