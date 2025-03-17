import FooterNav from '../components/FooterNav';
import ScrollablePosts from '../components/ScrollablePosts';
import AnimalList from '../components/AnimalList';
import React, { useState, useEffect, SetStateAction } from 'react';

const Home = () => {
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState('20rem');
    //const [scrolled, setScrolled] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Check screen size on initial render

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    
    const handleScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
        //console.log("scrollTop: ", scrollTop);
        //console.log("scrollHeight: ", scrollHeight);
        //console.log("clientHeight: ", clientHeight);
        //setScrolled(Math.max(scrolled,scrollTop));
        setHeaderHeight(`${20*(clientHeight - 2*scrollTop)/clientHeight}rem`);
        
    };


    return (
        <div className='w-full'>
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'
                style={{ height: headerHeight }}
            >
                🆄🅽🅸🅼🅰🅻🆂
            </div>
            <div className='w-12 flex p-3 pt-0 min-h-screen text-center bg-blue-100'>
                {!isSmallScreen && <AnimalList title="Good Ones" is_best={true} />}
                {!isSmallScreen ? <ScrollablePosts width='w-8' onScroll={handleScroll}/> : <ScrollablePosts width='w-12' onScroll={handleScroll}/>}
                {!isSmallScreen && <AnimalList title="Bad Ones" is_best={false} />}
            </div>
            <FooterNav />
        </div>
    );
};

export default Home;