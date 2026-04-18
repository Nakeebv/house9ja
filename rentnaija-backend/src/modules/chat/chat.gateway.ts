import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) this.userSockets.delete(client.data.userId);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    client.join(`chat:${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    client.leave(`chat:${chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string; type?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO'; mediaUrl?: string },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.chatId,
        client.data.userId,
        data.content,
        data.type ?? 'TEXT',
        data.mediaUrl,
      );
      this.server.to(`chat:${data.chatId}`).emit('new_message', message);
      return message;
    } catch (err: any) {
      client.emit('message_error', { message: err?.message ?? 'Could not send message.' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    client.to(`chat:${chatId}`).emit('user_typing', { userId: client.data.userId });
  }

  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
