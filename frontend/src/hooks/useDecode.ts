import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const useDecode = () => {
    const [storedUserId, setStoredUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try{
            const token = Cookies.get('session_token');
            if (token) {
                const decodedToken: any = jwtDecode(token);
                const storedUserId = decodedToken.user_id;
                if (storedUserId) {
                    setStoredUserId(storedUserId);
                }
            }
        }
        catch (error) {
            console.error('Error decoding token:', error);
            setStoredUserId(null);
        }
        finally{
            setIsLoading(false);
        }
    }, []);

    return {storedUserId, isLoading};
};

export default useDecode;