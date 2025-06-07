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
    
    const fetchAnimals = async (name: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/animals?name=${name}`);
        const data = await response.json();
        setAnimals(data);
    };

    useEffect(() => {
        fetchAnimals(searchText);
    }, [searchText]);

    const handleAnimalClick = (animalId: number) => {
        setSelectedAnimalIds((prevSelectedAnimalIds) => {
            if (prevSelectedAnimalIds.includes(animalId)) {
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

    
    useEffect(() => {
        if (!previewUrl) return;

        const sendPreviewImage = async () => {
            try {
            //console.log("Starting image processing");
            // Convert blob URL to base64
            const response = await fetch(previewUrl);
            if (!response.ok) {
                console.error(`Failed to fetch preview URL: ${response.status}`);
                return;
            }
            
            const blob = await response.blob();
            //console.log(`Got blob: ${blob.type}, ${blob.size} bytes`);
            
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                const base64String = reader.result as string;
                //console.log(`Base64 string length: ${base64String.length}`);
                
                const payload = { post_preview_image: base64String.split(',')[1] };
                //console.log(`Sending payload with ${payload.post_preview_image.length} characters`);
                
                // Send base64 image to backend
                fetch('https://unimals-backend.vercel.app/api/posts/animal_detect', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })
                .then(res => {
                    //console.log(`Backend response status: ${res.status}`);
                    if (!res.ok) {
                    res.text().then(text => {
                        console.error(`Server responded with status ${res.status}: ${text}`);
                    });
                    throw new Error(`Network response was not ok (${res.status})`);
                    }
                    return res.json();
                })
                .then(animalIds => {       
                    setSelectedAnimalIds(animalIds);
                    resolve(null);
                })
                .catch(error => {
                    console.error('Failed to fetch animal IDs:', error);
                    resolve(null);
                });
                };
                reader.readAsDataURL(blob);
            });
            } catch (error) {
            console.error('Error processing image:', error);
            }
        };

    sendPreviewImage();
    }, [previewUrl]);
    

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

        const response = await fetch('https://unimals-backend.vercel.app/api/posts/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        });

        if (response.ok) {
            const data = await response.json();
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

        router.push("/profile");
    }

    return (
        <div className='w-full'>
            <div className='w-12 flex text-4xl p-1 bg-blue-700 align-items-center justify-content-center'>
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
                            <div>
                                Animals in Post:
                            </div>
                            <div className='w-12 flex text-4xl align-items-center justify-content-center'>
                                <div className='w-10'>
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
                                <div className='w-2'>
                                    <Button 
                                        icon="pi pi-times"
                                        className='p-button-sm p-button-rounded bg-red-500'
                                        aria-label="Clear"
                                        onClick={() => {
                                            setSelectedAnimalIds([]);
                                            setSearchTerm('');
                                            setSearchText('');
                                        }}
                                    />
                                </div>
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