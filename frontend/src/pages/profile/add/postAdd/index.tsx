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
import useAuth from '../../../../components/UseAuth';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1', 
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
    }
});

const PostAdd: React.FC = () => {
    useAuth();

    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [searchText, setSearchText] = useState('');
    const [tempText, setTempText] = useState<string>('');
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const [selectedAnimalIds, setSelectedAnimalIds] = useState<number[]>([]);
    const [storedUserId, setStoredUserId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('userId');
            setStoredUserId(userId);
        }
    }, []);


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
    
    const fetchAnimals = async (name: string) => {
        const response = await fetch(`http://127.0.0.1:5000/api/animals?name=${name}`);
        const data = await response.json();
        setAnimals(data);
    };

    useEffect(() => {
        fetchAnimals(searchText);
    }, [searchText]);

    /*
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/animals?name=${searchText}`)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setAnimals(data);
            });
        
    
    }, [searchText]);
    */

    const handleAnimalClick = (animalId: number) => {
        setSelectedAnimalIds((prevSelectedAnimalIds) => {
            if (prevSelectedAnimalIds.includes(animalId)) {
                console.log(animalId);
                return prevSelectedAnimalIds.filter((id) => id !== animalId);
            } 
            else {
                return [...prevSelectedAnimalIds, animalId];
            }
        });
        fetchAnimals(searchText);
    };

    const gridCardTemplate = (animal: Animal) => {
        const isSelected = selectedAnimalIds.includes(animal.id as number);
        return (
            <div
                className={`grid-card_postadd w-2 ${isSelected ? `bg-green-500` : ``}`}
                key={animal.id}
                onClick={() => {
                    handleAnimalClick(animal.id as number);
                }}
            >
                <img
                    src={animal.profile_photo}
                    alt={`Photo of ${animal.name}`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/default_avatar.png';
                    }}
                    
                />
                <p>{animal.name}</p>
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
            Key: `posts/${Date.now()}-${file.name}`,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type,
            /*ACL: 'public-read'*/
        };
    
        try {
            const command = new PutObjectCommand(params);
            console.log(command);
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
            alert('Post image upload failed');
            return null;
        }
    };

    const uploadToDB = async (imageUrl: string) => {
        const post = {
            user_id: storedUserId,
            image: imageUrl,
            description: description,
            animal_ids: selectedAnimalIds
        };

        const response = await fetch('http://127.0.0.1:5000/api/posts/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Post added successfully:', data);
        } 
        else {
            console.error('Error adding post:', response.statusText);
        }
    };

    const addPost = async () => {
        // Fix bad chars
        const sanitizedUrls = uploadedUrls.map(url => url.replace(/ /g, '_'));
        setUploadedUrls(sanitizedUrls);

        // add post to database
        const imageUrl = await uploadToS3();

        // save img to the S3 AWS
        if (imageUrl) {
            await uploadToDB(imageUrl);
        }
    }

    return (
        <div className='w-full'>
            <div className='w-12 flex text-4xl p-2 bg-blue-700 align-items-center justify-content-center'>
                <Button
                    className="p-button-lg p-button-success w-2 justify-content-center"
                    onClick={addPost}
                >    
                    POST IT
                </Button>
            </div>
            
            <div className='w-full flex p-8 pt-0 pl-0 min-h-screen justify-center items-center '>
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
                <div className='w-6'>
                    <div className='w-full p-4 pt-6  max-h-min text-center'>
                        <div className='w-full'>
                            <div>Description:</div>
                        </div>
                        <div className='w-full pt-2'>
                            <InputTextarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Enter description" 
                                className="p-inputtext p-component w-full"
                                rows={5} // init number of row
                                autoResize
                            />
                        </div>
                    </div>
                    <div className='w-full p-4  min-h-screen text-center'>
                        <div className='w-full'>
                            <div>Animals in Post:
                            </div>
                            <div className='w-12 flex text-4xl align-items-center justify-content-center'>
                            <span className="p-input-icon-left w-1/2">
                                <InputText
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onInput={handleInputChange}
                                    placeholder="Search..."
                                    className="w-full"
                                />
                            </span>
                        </div>
                        </div>
                        <div className='w-full '>
                            <div className="animal-list scrollable">
                                {animals.length > 0 ? (
                                    <div className="grid-view_addpost">
                                        {animals.map((animal) => gridCardTemplate(animal))}
                                    </div>
                                ) : (
                                    <div className="block h-full">
                                        <p>No animals found</p>
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

export default PostAdd;