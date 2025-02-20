import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useDecode from './useDecode';

const useAuth = () => {
    const { storedUserId, isLoading } = useDecode();
    const router = useRouter();

    useEffect(() => {
        if(!isLoading && !storedUserId) {
            router.push('/profile');
            
        }
    }, [storedUserId, router, isLoading]);
};

export default useAuth;