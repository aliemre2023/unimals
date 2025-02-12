import FooterNav from '../components/FooterNav';
import ScrollablePosts from '../components/ScrollablePosts';
import AnimalList from '../components/AnimalList'
import React, { useState, useEffect } from 'react';

const Home = () => {
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Check screen size on initial render

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className='w-full'>
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                UNIMALS
            </div>
            <div className='w-12 flex p-3 pt-0 min-h-screen text-center bg-blue-100'>
                {!isSmallScreen && <AnimalList title="Good Ones" is_best={true} />}
                {!isSmallScreen ? <ScrollablePosts width='w-8'/> :  <ScrollablePosts width='w-12'/>}
                {!isSmallScreen && <AnimalList title="Bad Ones" is_best={false} />}
            </div>
            <FooterNav />
        </div>
    );
};

export default Home;