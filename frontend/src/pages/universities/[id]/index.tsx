import { InputText } from 'primereact/inputtext';
import FooterNav from '../../../components/FooterNav';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const UniversityInfo = () => {
    const router = useRouter();
    const { id } = router.query; 

    const [searchTermAnimal, setSearchTermAnimal] = useState('');
    const [searchTermUser, setSearchTermUser] = useState('');
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tempText, setTempText] = useState('');
    const [searchTextAnimal, setSearchTextAnimal] = useState('');
    const [searchTextUser, setSearchTextUser] = useState('');
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const [university, setUniversity] = useState<University | null>(null);


    const handleSearchChangeAnimal = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTermAnimal(event.target.value);
    };

    const handleInputChangeAnimal = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setTempText(value);

        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current); // clear debounce
        }
        searchDebounce.current = setTimeout(() => {
            setSearchTextAnimal(value.trim());
        }, 300); // delay
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/animals?university_id=${id}&name=${searchTextAnimal}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("ID: ", id);
                console.log(data);
                setAnimals(data);
            });
        
   
    }, [id, searchTextAnimal]);

    // // // 

    const handleSearchChangeUser = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTermUser(event.target.value);
    };

    const handleInputChangeUser = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setTempText(value);

        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current); // clear debounce
        }
        searchDebounce.current = setTimeout(() => {
            setSearchTextUser(value.trim());
        }, 300); // delay
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/profiles?university_id=${id}&name=${searchTextUser}`)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setUsers(data);
            });
        
   
    }, [id, searchTextUser]);

    const gridCardTemplateAnimal = (animal: Animal) => {
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

    const gridCardTemplateUser = (user: User) => {
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

    // // //

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/universities?id=${id}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("universiy data: " ,data);
                setUniversity(data);
                console.log("universiy data my: " ,university);
                if (Array.isArray(data) && data.length > 0) {
                    setUniversity(data[0]);
                }
            });
    }, [id]);

    useEffect(() => {
        console.log("university data my: ", university);
    }, [university]);

    if (!university) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full">
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                UNIMALS in {university.abbreviation ? university.abbreviation : university.name}
            </div>
            <div className='flex'>
                <div className='w-6'>
                    <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                        <span className="p-input-icon-left w-1/2">
                            <InputText
                                value={searchTermUser}
                                onChange={handleSearchChangeUser}
                                onInput={handleInputChangeUser}
                                placeholder="Search user..."
                                className="w-full"
                            />
                        </span>
                    </div>
                    <div className="animal-list">
                        {users.length > 0 ? (
                            <div className="grid-view_unipost pl-6 pr-3">
                                {users.map((users) => gridCardTemplateUser(users))}
                            </div>
                        ) : (
                            <div className="block h-full text-center">
                                <p>No user found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='w-6'>
                    <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                        <span className="p-input-icon-left w-1/2">
                            <InputText
                                value={searchTermAnimal}
                                onChange={handleSearchChangeAnimal}
                                onInput={handleInputChangeAnimal}
                                placeholder="Search animal..."
                                className="w-full"
                            />
                        </span>
                    </div>
                    <div className="animal-list">
                        {animals.length > 0 ? (
                            <div className="grid-view_show pr-6 pl-3">
                                {animals.map((animal) => gridCardTemplateAnimal(animal))}
                            </div>
                        ) : (
                            <div className="block h-full text-center">
                                <p>No animal found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <FooterNav />
        </div>
    );
};

export default UniversityInfo;