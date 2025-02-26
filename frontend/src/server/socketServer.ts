import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export class SocketServer {
    private static io: SocketIOServer | null = null;

    static getInstance(res?: NextApiResponse): SocketIOServer {
        if (!SocketServer.io && res) {
            const httpServer: HTTPServer = (res.socket as any).server;
            SocketServer.io = new SocketIOServer(httpServer, {
                path: '/api/socketio',
                cors: {
                    origin: 'https://unimals.vercel.app',
                    methods: ['GET', 'POST'],
                    allowedHeaders: ['Content-Type'],
                    credentials: true
                }
            });
        }
        return SocketServer.io as SocketIOServer;
    }
}