import React, { useEffect, useRef, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import FooterNav from '../../../../components/FooterNav';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { InputText } from 'primereact/inputtext';
import dotenv from 'dotenv';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import AnimalsList from '../../../../components/AnimalList';
import AnimalList from '../../../../components/AnimalList';
import { useRouter } from 'next/router';
import useAuth from '../../../../hooks/useAuth';
import useDecode from '../../../../hooks/useDecode';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1', 
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
    }
});

const RoomAdd: React.FC = () => {
    useAuth();

    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tempText, setTempText] = useState<string>('');
    const [searchText, setSearchText] = useState('');
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const [roomType, setRoomType] = useState<string>('public');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsersIds, setSelectedUsersIds] = useState<number[]>([]);
    const router = useRouter();
    const {storedUserId, isLoading} = useDecode();

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setTempText(value);

        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current); // clear debounce
        }
        searchDebounce.current = setTimeout(() => {
            setSearchText(value.trim());
        }, 300); // delay
    };

    const fetchUsers = async (name: string) => {
        const response = await fetch(`http://127.0.0.1:5000/api/profiles?name=${name}`)
        if(response.ok){
            const data = await response.json();
            setUsers(data);
        }
        else{
            console.error("Failed to fetch users");
        }
    };

    useEffect(() => {
        fetchUsers(searchText);
    }, [searchText]);

    const handleUserClick = (userId: number) => {
        setSelectedUsersIds((prevSelectedUsersIds) => {
            if (prevSelectedUsersIds.includes(userId)) {
                return prevSelectedUsersIds.filter((id) => id !== userId);
            } 
            else {
                return [...prevSelectedUsersIds, userId];
            }
        });
        fetchUsers(searchText);
    };

    const gridCardTemplateUser = (user: User) => {
        const isSelected = selectedUsersIds.includes(user.id);
        return (
            <div
            className={`grid-card_postadd w-2 ${isSelected ? `bg-green-500` : ``}`}
                key={user.id}
                onClick={() => {
                    handleUserClick(user.id);
                }}
            >
                <img
                    src={user.profile_photo || '/icon_profile.png'}
                    alt={`Photo of ${user.name}`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/icon_profile.png';
                    }}
                    className="animal-photo"
                />
                <p>{user.name}</p>
            </div>
        );
    };


    const onDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        setUploadProgress(0);
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg']
        },
        multiple: false
    });
    
    const uploadToS3 = async (): Promise<string | null> => {
        if (files.length === 0) {
            alert('Please select a file first');
            return null;
        }

        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const params = {
            Bucket: 'bucketae20233',
            Key: `rooms/${Date.now()}-${file.name}`,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type,
            /*ACL: 'public-read'*/
        };
    
        try {
            const command = new PutObjectCommand(params);
            const s3Response = await s3Client.send(command);
            
            // public URL
            const region = process.env.AWS_REGION || 'us-east-1';
            const imageUrl = `https://${params.Bucket}.s3.${region}.amazonaws.com/${params.Key}`;
            setUploadedUrls([...uploadedUrls, imageUrl]);
            
            setUploadProgress(100);

            return imageUrl;
        } 
        catch (error) {
            console.error('S3 Upload Error:', error);
            alert('Room image upload failed');
            return null;
        }
    };

    const uploadToDB = async (imageUrl: string) => {
        let is_public = true
        if(roomType != 'public'){
            is_public = false;
        }

        const room = {
            constructor_id: storedUserId,
            image: imageUrl,
            room_name: roomName,
            room_type: is_public,
            participants: selectedUsersIds
        };

        const response = await fetch('http://127.0.0.1:5000/api/rooms/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(room)
        });

        if (response.ok) {
            const data = await response.json();
        } 
        else {
            console.error('Error adding room:', response.statusText);
        }
    };

    const addRoom = async () => {
        // Fix bad chars, probably not work
        const sanitizedUrls = uploadedUrls.map(url => url.replace(/ /g, '_'));
        setUploadedUrls(sanitizedUrls);

        // add post to database
        const imageUrl = await uploadToS3();

        // save img to the S3 AWS
        if (imageUrl) {
            await uploadToDB(imageUrl);
        }

        router.push("/profile");
    }

    return (
        <div className='w-full'>
            <div className='w-12 flex text-4xl p-2 bg-blue-700 align-items-center justify-content-center'>
                <Button
                    className="p-button-lg p-button-success w-2 justify-content-center"
                    onClick={addRoom}
                >    
                    ROOM IT
                </Button>
            </div>
            
            <div className='w-full flex p-8 pt-0 pl-0 min-h-screen justify-center items-center'>
                <div 
                    {...getRootProps()} 
                    className={`
                        w-6 max-w-md 
                        p-6 
                        border-2 border-dashed 
                        ${isDragActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}
                        text-center 
                        cursor-pointer 
                        hover:bg-gray-50 
                        transition-colors
                        m-6 mb-8
                        max-h-min
                        scrollable
                    `}
                >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Drop the files here ...</p>
                    ) : (
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    )}
                    
                    {files.length > 0 && (
                        <div className='mt-4'>
                            <p>Selected File:</p>
                            <p className='font-bold'>{files[0].name}</p>

                            {previewUrl && (
                                <div className='m-1 pt-2 w-full overflow-hidden flex justify-center items-center'>
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className='max-w-full max-h-full object-contain'
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    
                    {uploadProgress > 0 && (
                        <div>Upload Progress: {uploadProgress}%</div>
                    )}
                    
                    {uploadedUrls.length > 0 && (
                        <div className='mt-4'>
                            <p>Uploaded URLs:</p>
                            {uploadedUrls.map((url, index) => (
                                <a 
                                    key={index} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className='text-blue-500 block'
                                >
                                    {url}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* // */}
                <div className='w-6'>
                    <div className='w-full p-4 pt-6  max-h-min text-center'>
                        <div className='w-full flex align-items-center justify-content-center p-2'>
                            <div className='w-2 pr-2'>Room Name:</div>
                            <InputTextarea 
                                value={roomName} 
                                onChange={(e) => setRoomName(e.target.value)} 
                                placeholder="Enter room name" 
                                className="p-inputtext p-component w-8"
                                rows={1} // init number of row
                                autoResize
                            />
                        </div>
                        <div className='w-full flex align-items-center justify-content-center p-2'>
                            <div className='w-2 pr-2'>Room Type:</div>
                            <Button 
                                label="Public" 
                                className={`m-2 ${roomType === 'public' ? 'p-button-success' : 'p-button-secondary'}`} 
                                onClick={() => setRoomType('public')} 
                            />
                            <Button 
                                label="Private" 
                                className={`m-2 ${roomType === 'private' ? 'p-button-danger' : 'p-button-secondary'}`} 
                                onClick={() => setRoomType('private')} 
                            />
                        </div>
                        
                    </div>
                    <div className='w-full p-4  min-h-screen text-center'>
                        <div className='w-full'>
                            <div>Room's users:
                            </div>
                            <div className='w-12 flex text-4xl align-items-center justify-content-center'>
                            <span className="p-input-icon-left w-1/2">
                                <InputText
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onInput={handleInputChange}
                                    placeholder="Search user..."
                                    className="w-full"
                                />
                            </span>
                        </div>
                        </div>
                        <div className='w-full'>
                            <div className="animal-list scrollable">
                                {users.length > 0 ? (
                                    <div className="grid-view_addpost">
                                        {users.map((users) => gridCardTemplateUser(users))}
                                    </div>
                                ) : (
                                    <div className="block h-full text-center">
                                        <p>No user found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                
                
            </div>
            
            
            <FooterNav />
        </div>
    );
};

export default RoomAdd;