import { NextApiRequest, NextApiResponse } from 'next'
import { SocketServer } from '../../server/socketServer'


const connectedSockets = new Set()

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
    const io = SocketServer.getInstance(res);

    io.on('connection', (socket) => {
        if(connectedSockets.has(socket.id)){
            return;
        }
        //console.log(`Client connected: ${socket.id}`);
        connectedSockets.add(socket.id);

        socket.on('joinRoom', (roomId: string) => {
            socket.join(roomId);
            //console.log(`User joined room: ${roomId}`);
            socket.emit('logMessage', `User joined room: ${roomId}`);
        })

        socket.on('leaveRoom', (roomId: string) => {
            socket.leave(roomId);
            //console.log(`User left room: ${roomId}`);
            socket.emit('logMessage', `User left room: ${roomId}`);
        })

        socket.on('sendMessage', (data: { roomId: string; message: any }) => {
            io.to(data.roomId).emit('newMessage', data.message);
            socket.emit('logMessage', `Message sent to room ${data.roomId}`);
        })

        socket.on('disconnect', () => {
            //console.log('Client disconnected');
        });
    });

    res.end(); 
};

// To enable WebSocket upgrade
export const config = {
    api: {
        bodyParser: false
    }
};