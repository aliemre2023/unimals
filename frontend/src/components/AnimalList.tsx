import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

// component props
interface AnimalsListProps {
    title: string;
    is_best: boolean;
}

const AnimalsList: React.FC<AnimalsListProps> = ({title, is_best}) => {
    const [bestAnimals, setBestAnimals] = useState<Animal[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/animals?is_goody=${true}`)
            .then((response) => {
                const data = response.json();
                return data;
            })
            .then((data) => {
                if (!is_best) {
                    data.reverse();
                }
                setBestAnimals(data);
            })
    }, [is_best]);

    return (
        <div className='w-2 align-items-center bg-blue-200 font-bold mr-2 ml-2 scrollable'>
            <div className='w-full text-xl mt-3'>{title}</div>
            {
                <ul className='m-2 bottom-fixer'>
                    {bestAnimals.map((animal) => (
                        <li key={animal.id}
                            className='mt-2 grid-item_withoutbackground'>
                            <img
                                src={animal.profile_photo || "/default_avatar.png"}
                                alt={`${animal.name}`}
                                className="w-12 sm:w-16 md:w-20 lg:w-24 xl:w-32 cursor-pointer"
                                onError={(e) => {
                                    e.currentTarget.src = '/default_avatar.png';
                                }}
                                onClick={() => {router.push(`/animals/${animal.id}`)}}
                            />
                        </li>
                    ))}
                </ul>
            }
        </div>
    );
};

export default AnimalsList;