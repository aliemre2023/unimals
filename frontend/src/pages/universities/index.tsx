import { InputText } from 'primereact/inputtext';
import FooterNav from '../../components/FooterNav';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const Universities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [universities, setUniversities] = useState<University[]>([]);
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
        fetch(`https://unimals-backend.vercel.app/api/universities?name=${searchText}`)
            .then((response) => response.json())
            .then((data) => {
                setUniversities(data);
            });
        
   
    }, [searchText]);

    const gridCardTemplate = (university: University) => {
        return (
            <div
                className="grid-card cursor-pointer"
                key={university.id}
                onClick={() => {
                    router.push(`/universities/${university.id}`);
                }}
            >
                <img
                    src={university.photo || '/icon_profile.png'}
                    alt={`Photo of ${university.name}`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/icon_profile.png';
                    }}
                    className="animal-photo"
                />
                <p>{university.abbreviation ? university.abbreviation + ' - ' : ''}{university.name}</p>
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
                {universities.length > 0 ? (
                    <div className="grid-view_show">
                        {universities.map((universities) => gridCardTemplate(universities))}
                    </div>
                ) : (
                    <div className="block h-full text-center">
                        <p>No university found</p>
                    </div>
                )}
            </div>
            <FooterNav />
        </div>
    );
};

export default Universities;