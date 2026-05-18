import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GetNotificationsDto, MarkReadDto } from './dto/notifications.dto';
import type { User } from '../db/schema';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications
  @Get()
  list(@CurrentUser() user: User, @Query() query: GetNotificationsDto) {
    return this.notificationsService.list(user.id, query.limit, query.offset);
  }

  // GET /notifications/unread-count
  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.notificationsService.unreadCount(user.id);
  }

  // PATCH /notifications/read
  @Patch('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUser() user: User, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(user.id, dto.ids);
  }
}
