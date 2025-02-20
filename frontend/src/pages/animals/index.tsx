import { InputText } from 'primereact/inputtext';
import FooterNav from '../../components/FooterNav';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const Animals = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [tempText, setTempText] = useState('');
    const [searchText, setSearchText] = useState('');
    const router = useRouter();
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);


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

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/animals?name=${searchText}`)
            .then((response) => response.json())
            .then((data) => {
                setAnimals(data);
            });
        
   
    }, [searchText]);

    const gridCardTemplate = (animal: Animal) => {
        return (
            <div
                className="grid-card cursor-pointer"
                key={animal.id}
                onClick={() => {
                    router.push(`/animals/${animal.id}`);
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
                    className="animal-photo"
                />
                <p>{animal.name}</p>
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                UNIMALS
            </div>
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
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
            <div className="animal-list">
                {animals.length > 0 ? (
                    <div className="grid-view_show">
                        {animals.map((animal) => gridCardTemplate(animal))}
                    </div>
                ) : (
                    <div className="block h-full">
                        <p>No animals found</p>
                    </div>
                )}
            </div>
            <FooterNav />
        </div>
    );
};

export default Animals;