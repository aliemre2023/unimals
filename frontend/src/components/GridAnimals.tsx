import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';

interface GridPostProps {
    user_id: string;
    edit: boolean;
    travelling: boolean;
}

const GridPosts: React.FC<GridPostProps> = ({user_id, edit, travelling}) => {
    const [userAnimals, setUserAnimals] = useState<Animal[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchUserAnimals(user_id);
    }, [user_id]);

    const fetchUserAnimals = async (user_id: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/animals?user_id=${user_id}`);
            if (response.ok) {
                const data = await response.json();
                setUserAnimals(data);
            } else {
                console.error('Failed to fetch user posts');
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
        }
    };

    
    const handleDeleteAnimal = async (post_id: string, user_id: string) => {
        const response = await fetch(`http://127.0.0.1:5000/api/animals/${post_id}/delete`, {
            method: 'DELETE',
        });
        if (response.ok) {
            fetchUserAnimals(user_id);
        } 
        else {
            console.error('Failed to delete post');
        }
        
    };
    

    return (
        <div className='grid-container bottom-fixer'
        >
            {userAnimals.length == 0 && !travelling && (
                <div className='grid-item flex align-items-center justify-content-center bg-blue-100 p-8'>
                    <Button
                        icon="pi pi-plus"
                        className="p-button-rounded p-button-lg fixed p-5"
                        onClick={() => {
                            router.push(`/profile/add/animalAdd`);
                        }}
                    />
                </div>   
            )}

            {userAnimals.map((animal) => (
                <div className='grid-item'>
                    {edit && (
                        <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-sm p-button-danger p-absolute p-top-0 p-right-0"
                            onClick={() => 
                                handleDeleteAnimal(animal.id as string, user_id)
                            }
                        />
                    )}
                    <div className='w-12 flex justify-conntent-center'>
                        <p className='pt-0 p-2 w-12 text-center font-bold'>{animal.name}</p>
                    </div>
                    <div key={animal.id} className=' flex align-items-center justify-content-center'>  
                        <img
                            src={animal.profile_photo || "/default_animal.jpg"}
                            className="w-full h-32 object-cover cursor-pointer"
                            onError={(e) => {
                                e.currentTarget.src = "/default_animal.jpg";
                            }}
                            onClick={() => {
                                router.push(`/animals/${animal.id}`)
                            }}
                        />
                    </div>
                    <div className='w-12 flex justify-conntent-center'>
                        <p className='pb-0 p-2 w-12 text-center font-italic'>{animal.kind}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GridPosts;