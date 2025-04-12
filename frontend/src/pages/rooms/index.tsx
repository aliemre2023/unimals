import React, { useState, useRef, useEffect } from 'react';
import FooterNav from '../../components/FooterNav';
import ProfilePhoto from '../../components/ProfilePhoto';
import useAuth from '../../hooks/useAuth';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Datetime } from 'aws-sdk/clients/costoptimizationhub';
import { useRouter } from 'next/router';
import { useSocket } from '../../hooks/useSocket';
import useDecode from '../../hooks/useDecode';

const RoomPage = () => {
    useAuth();

    //const [userId, setUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [secretRooms, setSecretRooms] = useState<Room[]>([]);
    const [activeButton, setActiveButton] = useState<string>('public');
    const [roomInfo, setRoomInfo] = useState<RoomInfo>({ messages: [], participants: [] });
    const [activeRoom, setActiveRoom] = useState<Room>();
    const [newMessage, setNewMessage] = useState('');
    const router = useRouter();
    const {storedUserId, isLoading} = useDecode();

    const socket = useSocket('https://unimals.vercel.app'); //  https://unimals.vercel.app
    //const socket = useSocket('https://unimals.vercel.app');

    useEffect(() => {
        if (!socket) {
            console.log("Socket.io does not run");
            return;
        }
        console.log("Socket.io runs");

        // Join room when activeRoomId changes
        if (activeRoom?.id) {
            console.log("Joined room: ", activeRoom?.room_name);
            socket.emit('joinRoom', activeRoom?.id);
        }

        // Listen for new messages
        socket.on('newMessage', (message) => {
            console.log("Message received:", message);
            setRoomInfo(prev => ({
                ...prev,
                messages: [...prev.messages, message]
            }));
        });

        return () => {
            if (activeRoom?.id) {
                socket.emit('leaveRoom', activeRoom?.id);
            }
            socket.off('newMessage');
        };
    }, [socket, activeRoom?.id]);






    const scrollableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
        }
    }, [roomInfo.messages]); // Update scroll when messages change

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleRoomClick = async (roomId: string, userId: string, room: Room) => {
        setActiveRoom(room);
        fetchPublicRooms();
        fetchSecretRooms(userId);
        await fetchRoomInfo(roomId);
    };

    const fetchPublicRooms = async () => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/rooms/public?room_name=${searchTerm}`);
        if(response.ok){
            const data = await response.json();
            setPublicRooms(data);
        }
        else{
            console.error('Failed to fetch public rooms');
        }
    };

    const fetchSecretRooms = async (userId: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/users/${userId}/rooms?room_name=${searchTerm}`);
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
            const response = await fetch(`https://unimals-backend.vercel.app/api/rooms/${roomId}`);
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
        if (!newMessage.trim() || !activeRoom?.id) return;

        try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/rooms/${activeRoom?.id}/message/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: storedUserId,
                    message: newMessage,
                    room_type: activeRoom.is_public
                }),
            });

            if (response.ok) {
                const messageData = await response.json();
                
                // Emit the message through WebSocket
                socket?.emit('sendMessage', {
                    roomId: activeRoom?.id,
                    message: {
                        user_id: storedUserId,
                        user_name: messageData.user_name,
                        message: newMessage,
                        date: new Date().toISOString(),
                    }
                });

                setNewMessage('');
                fetchRoomInfo(activeRoom.id);
                
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
        if (storedUserId) {    
            fetchSecretRooms(storedUserId);
        }
    }, [storedUserId, searchTerm]);  

    return (
        <div className="w-full bg-blue-700">
            <div className='w-12 flex'>
                <div className='w-4 flex text-4xl p-3  align-items-center justify-content-center'>
                    <span className="p-input-icon-left">
                        <InputText
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search a Room..."
                            className="w-full"
                        />
                    </span>
                </div>

                <div className='w-8 flex text-4xl p-3  align-items-center justify-content-center'>
                    <span className="p-input-icon-left">
                        <h3>{activeRoom?.room_name}</h3>
                    </span>
                </div>
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
                                className={`flex p-3 m-1 border-round-lg cursor-pointer  ${activeRoom?.id === room.id ? 'bg-green-200' : 'bg-gray-200'}`}
                                onClick={() => handleRoomClick(room.id, storedUserId as string, room)}
                            >
                                <ProfilePhoto img={room.room_photo} height={"40"} thick_border={false} type={"rooms"} id={room.id}/>
                                <p className='p-2'>{room.room_name}</p>
                            </div>
                        ))
                    ) : (
                        publicRooms.map((room, index) => (
                            <div 
                                key={index} 
                                className={`flex p-3 m-1 border-round-lg cursor-pointer ${activeRoom?.id === room.id ? 'bg-green-200' : 'bg-gray-200'}`}
                                onClick={() => handleRoomClick(room.id, storedUserId as string, room)}
                            >
                                <ProfilePhoto img={room.room_photo} height={"40"} thick_border={false} type={"rooms"} id={room.id}/>
                                <p className='p-2'>{room.room_name}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className='w-8 h-screen bg-blue-100 flex flex-col p-2 pt-0 pb-0'>
                    <div 
                        ref={scrollableRef}
                        className="scrollable w-12 pb-6"
                        style={{ 
                            maxHeight: 'calc(100vh - 17vh)',
                        }}
                    >
                        {roomInfo.messages.map((message, index) => (
                            <div key={index} className={`flex ${message.user_id == storedUserId ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`w-8 p-3 p-2 m-2 ${message.user_id == storedUserId ? 'bg-green-300' : 'bg-gray-300'} border-round-lg`}>
                                    {message.user_id != storedUserId ? 
                                    (
                                        <div 
                                            className="text-sm font-bold mb-1 cursor-pointer"
                                            onClick={() => {router.push(`/profiles/${message.user_id}`)}}
                                        >
                                            {message.user_name}
                                        </div>
                                    ) :
                                    (
                                        <div></div>
                                    )
                                    }
                                    <div className='left-align'
                                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                    >
                                        {message.message}
                                    </div>
                                    <div className={`text-xxs ${message.user_id == storedUserId  ? 'right-align' : 'left-align'}`}>
                                        {new Date(message.date).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex w-12 bottom-0 fixed room_text_bottommargin pb-2 pr-6" >
                        <InputTextarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-6"
                            rows={1} 
                            autoResize
                            disabled={!activeRoom?.id}
                        />
                        <Button
                            label="Send"
                            icon="pi pi-send"
                            onClick={handleSendMessage}
                            className="w-2 ml-2"
                            disabled={!activeRoom?.id || !newMessage.trim()}
                        />
                    </div>
                </div>
            </div>
            <FooterNav />
        </div>
    );
};

export default RoomPage;