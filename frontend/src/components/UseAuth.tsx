import { useEffect } from 'react';
import { useRouter } from 'next/router';

const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                router.push('/profile'); // Redirect to login page if not authenticated
            }
        }
    }, [router]);
};

export default useAuth;