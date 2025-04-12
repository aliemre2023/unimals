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

const AnimalAdd: React.FC = () => {
    useAuth();

    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [animalName, setAnimalName] = useState<string>('');
    const [animalKind, setAnimalKind] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tempText, setTempText] = useState<string>('');
    const [universities, setUniversities] = useState<University[]>([]);
    const [searchText, setSearchText] = useState('');
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const [selectedUniversityId, setSelectedUniversityId] = useState<number>();
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
    
    const fetchUniversities = async (name: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/universities?name=${name}`);
        const data = await response.json();
        setUniversities(data);
    };

    useEffect(() => {
        fetchUniversities(searchText);
    }, [searchText]);

    const handleUniversityClick = (universityId: number) => {
        if(selectedUniversityId != universityId){
            setSelectedUniversityId(universityId);
        }
        else{
            setSelectedUniversityId(0);
        }
        
    };

    const gridCardTemplate = (university: University) => {
        return (
            <div
                className={`grid-card_animaladd w-2 ${university.id === selectedUniversityId ? 'bg-green-500' : ''}`}
                key={university.id}
                onClick={() => handleUniversityClick(university.id)}
            >
                <p className=''>{university.name}</p>
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
            Key: `animals/${Date.now()}-${file.name}`,
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
            alert('Animal image upload failed');
            return null;
        }
    };

    const uploadToDB = async (imageUrl: string) => {
        const animal = {
            user_id: storedUserId,
            image: imageUrl,
            animal_name: animalName,
            animal_kind: animalKind,
            university_id: selectedUniversityId
        };

        const response = await fetch('https://unimals-backend.vercel.app/api/animals/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(animal)
        });

        if (response.ok) {
            const data = await response.json();
        } 
        else {
            console.error('Error adding post:', response.statusText);
        }
    };

    const addAnimal = async () => {
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
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                <Button
                    className="p-button-lg p-button-success w-2 justify-content-center"
                    onClick={addAnimal}
                >    
                    ANIMAL IT
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
                        <div className='w-full flex align-items-center justify-content-center p-2'>
                            <div className='w-2 pr-2'>Animal Name:</div>
                            <InputTextarea 
                                value={animalName} 
                                onChange={(e) => setAnimalName(e.target.value)} 
                                placeholder="Enter animal name" 
                                className="p-inputtext p-component w-8"
                                rows={1} // init number of row
                                autoResize
                            />
                        </div>
                        <div className='w-full flex align-items-center justify-content-center p-2'>
                            <div className='w-2 pr-2'>Animal Kind:</div>
                            <InputTextarea 
                                value={animalKind} 
                                onChange={(e) => setAnimalKind(e.target.value)} 
                                placeholder="Enter animal kind" 
                                className="p-inputtext p-component w-8"
                                rows={1} // init number of row
                                autoResize
                            />
                        </div>
                        
                    </div>
                    <div className='w-full p-4  min-h-screen text-center'>
                        <div className='w-full'>
                            <div>Animal's university:
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
                                {universities.length > 0 ? (
                                    <div className="grid-view_addpost">
                                        {universities.map((universities) => gridCardTemplate(universities))}
                                    </div>
                                ) : (
                                    <div className="block h-full">
                                        <p>No univerity found</p>
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

export default AnimalAdd;