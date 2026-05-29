import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from '@/lib/utils';

let _socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (_socket?.connected) return _socket;
  _socket?.disconnect();
  _socket = io(process.env.NEXT_PUBLIC_WS_URL_PT || process.env.NEXT_PUBLIC_WS_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['polling', 'websocket'],
  });
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
