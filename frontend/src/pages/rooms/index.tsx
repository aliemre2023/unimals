import React, { useState, useRef, useEffect } from 'react';
import FooterNav from '../../components/FooterNav';
import ProfilePhoto from '../../components/ProfilePhoto';
import useAuth from '../../components/UseAuth';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Datetime } from 'aws-sdk/clients/costoptimizationhub';
import { useRouter } from 'next/router';
import { useSocket } from '../../hooks/useSocket';

const RoomPage = () => {
    useAuth();

    const [userId, setUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [secretRooms, setSecretRooms] = useState<Room[]>([]);
    const [activeButton, setActiveButton] = useState<string>('public');
    const [roomInfo, setRoomInfo] = useState<RoomInfo>({ messages: [], participants: [] });
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
                setUserId(storedUserId);
            }
        }
    }, []);

    const socket = useSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000');

    useEffect(() => {
        if (!socket) return;

        // Join room when activeRoomId changes
        if (activeRoomId) {
            socket.emit('joinRoom', activeRoomId);
        }

        // Listen for new messages
        socket.on('newMessage', (message) => {
            setRoomInfo(prev => ({
                ...prev,
                messages: [...prev.messages, message]
            }));
        });

        return () => {
            if (activeRoomId) {
                socket.emit('leaveRoom', activeRoomId);
            }
            socket.off('newMessage');
        };
    }, [socket, activeRoomId]);






    const scrollableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
        }
    }, [roomInfo.messages]); // Update scroll when messages change

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleRoomClick = async (roomId: string) => {
        setActiveRoomId(roomId);
        await fetchRoomInfo(roomId);
    };

    const fetchPublicRooms = async () => {
        const response = await fetch(`http://127.0.0.1:5000/api/rooms/public?room_name=${searchTerm}`);
        if(response.ok){
            const data = await response.json();
            setPublicRooms(data);
        }
        else{
            console.error('Failed to fetch public rooms');
        }
    };

    const fetchSecretRooms = async (userId: string) => {
        const response = await fetch(`http://127.0.0.1:5000/api/users/${userId}/rooms?room_name=${searchTerm}`);
        if(response.ok){
            const data = await response.json(); 
            setSecretRooms(data);
        }
        else{
            console.error('Failed to fetch secret rooms');
        }
    }; 

    const fetchRoomInfo = async (roomId: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/rooms/${roomId}`);
            if (response.ok) {
                const data = await response.json();
                setRoomInfo(data);
            } else {
                console.error("Failed to fetch room's info");
                setRoomInfo({ messages: [], participants: [] }); 
            }
        } catch (error) {
            console.error("Error fetching room info:", error);
            setRoomInfo({ messages: [], participants: [] });
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeRoomId) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/rooms/${activeRoomId}/message/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    message: newMessage,
                }),
            });

            if (response.ok) {
                const messageData = await response.json();
                
                // Emit the message through WebSocket
                socket?.emit('sendMessage', {
                    roomId: activeRoomId,
                    message: {
                        user_id: userId,
                        user_name: messageData.user_name,
                        message: newMessage,
                        date: new Date().toISOString(),
                    }
                });

                setNewMessage('');


                
                /*
                setNewMessage('');
                await fetchRoomInfo(activeRoomId);
                */
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleShowChatTypePrivate = async () => {
        setActiveButton('private');
    };
    
    const handleShowChatTypePublic = async () => {
        setActiveButton('public');
    };

    useEffect(() => {
        fetchPublicRooms();
        if (userId) {    
            fetchSecretRooms(userId);
        }
    }, [userId, searchTerm]);  

    return (
        <div className="w-full bg-blue-700">
            <div className='w-4 flex text-4xl p-3  align-items-center justify-content-center'>
                <span className="p-input-icon-left w-1/2">
                    <InputText
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search a Room..."
                        className="w-full"
                    />
                </span>
            </div>

            <div className='w-12 flex'>
                <div className='w-4 h-screen bg-blue-300 p-2 scrollable bottom-fixer'
                >
                    <div className='w-12 flex justify-content-center'>
                        <Button 
                            icon='pi pi-lock'
                            className={`m-2 ${activeButton === 'private' ? 'p-button-danger' : 'p-button-secondary'}`}
                            onClick={handleShowChatTypePrivate}
                        />
                        <Button 
                            icon='pi pi-lock-open'
                            className={`m-2 ${activeButton === 'public' ? 'p-button-success' : 'p-button-secondary'}`}
                            onClick={handleShowChatTypePublic}
                        />
                        <Button 
                            icon='pi pi-plus'
                            className={`m-2 bg-blue-900`}
                            onClick={() => {
                                router.push("/profile/add/roomAdd")
                            }}
                        />
                    </div>
                    {activeButton === 'private' ? (
                        secretRooms.map((room, index) => (
                            <div 
                                key={index} 
                                className={`flex p-3 m-1 bg-gray-200 border-round-lg cursor-pointer ${activeRoomId === room.id ? 'bg-blue-200' : ''}`}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <ProfilePhoto img={room.room_photo} height={"40"} thick_border={false} type={"rooms"} id={room.id}/>
                                <p className='p-2'>{room.room_name}</p>
                            </div>
                        ))
                    ) : (
                        publicRooms.map((room, index) => (
                            <div 
                                key={index} 
                                className={`flex p-3 m-1 bg-gray-200 border-round-lg cursor-pointer ${activeRoomId === room.id ? 'bg-blue-200' : ''}`}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <ProfilePhoto img={room.room_photo} height={"40"} thick_border={false} type={"rooms"} id={room.id}/>
                                <p className='p-2'>{room.room_name}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className='w-8 h-screen bg-blue-100 flex flex-col p-2'>
                    <div 
                        ref={scrollableRef}
                        className="scrollable w-12"
                        style={{ 
                            maxHeight: 'calc(100vh - 175px)',
                        }}
                    >
                        {roomInfo.messages.map((message, index) => (
                            <div key={index} className={`flex ${message.user_id === userId ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`w-8 p-3 m-2 ${message.user_id === userId ? 'bg-green-300' : 'bg-gray-300'} border-round-lg`}>
                                    {message.user_id !== userId && (
                                        <div 
                                            className="text-sm font-bold mb-1 cursor-pointer"
                                            onClick={() => {router.push(`/profiles/${message.user_id}`)}}
                                        >
                                            {message.user_name}
                                        </div>
                                    )}
                                    <div className='left-align'
                                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                    >
                                        {message.message}
                                    </div>
                                    <div className={`text-xxs ${message.user_id === userId ? 'right-align' : 'left-align'}`}>
                                        {new Date(message.date).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex w-12 bottom-10 p-2 pr-6 fixed">
                        <InputTextarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-6"
                            rows={1} 
                            autoResize
                            disabled={!activeRoomId}
                        />
                        <Button
                            label="Send"
                            icon="pi pi-send"
                            onClick={handleSendMessage}
                            className="w-2 ml-2"
                            disabled={!activeRoomId || !newMessage.trim()}
                        />
                    </div>
                </div>
            </div>
            <FooterNav />
        </div>
    );
};

export default RoomPage;