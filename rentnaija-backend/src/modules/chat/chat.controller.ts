import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrGet(@Body() body: { propertyId: string; landlordId: string }, @Request() req: any) {
    return this.chatService.getOrCreateConversation(body.propertyId, req.user.id, body.landlordId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  getUnread(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Get(':chatId/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('chatId') chatId: string, @Request() req: any, @Query('page') page?: string) {
    return this.chatService.getMessages(chatId, req.user.id, page ? Number(page) : 1);
  }

  @Post(':chatId/messages')
  @UseGuards(JwtAuthGuard)
  sendMessage(@Param('chatId') chatId: string, @Body() body: { content: string; type?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO'; mediaUrl?: string }, @Request() req: any) {
    return this.chatService.sendMessage(chatId, req.user.id, body.content, body.type ?? 'TEXT', body.mediaUrl);
  }
}
