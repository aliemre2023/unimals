import { InputText } from 'primereact/inputtext';
import FooterNav from '../../components/FooterNav';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const Profiles = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
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
        fetch(`http://127.0.0.1:5000/api/profiles?name=${searchText}`)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setUsers(data);
            });
        
   
    }, [searchText]);

    const gridCardTemplate = (user: User) => {
        return (
            <div
                className="grid-card cursor-pointer"
                key={user.id}
                onClick={() => {
                    router.push(`/profiles/${user.id}`);
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
                {users.length > 0 ? (
                    <div className="grid-view_show">
                        {users.map((users) => gridCardTemplate(users))}
                    </div>
                ) : (
                    <div className="block h-full">
                        <p>No profile found</p>
                    </div>
                )}
            </div>
            <FooterNav />
        </div>
    );
};

export default Profiles;