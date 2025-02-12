import React, { useState } from 'react';
import FooterNav from '../../components/FooterNav';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';

const Search = () => {
    const router = useRouter();

    return (
        <div className="w-full">
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                UNIMALS
            </div>
            <div className="flex justify-content-center align-items-center flex-column">
                <img
                    className='grid-card bg-blue-200 cursor-pointer'
                    src='/icon_university.png'
                    onClick={() => {
                        router.push(`/universities`);
                    }}
                />
                <img
                    className='grid-card bg-blue-200 cursor-pointer'
                    src='/icon_dog.png'
                    onClick={() => {
                        router.push(`/animals`);
                    }}
                />
                <img
                    className='grid-card bg-blue-200 cursor-pointer'
                    src='/icon_profile.png'
                    onClick={() => {
                        router.push(`/profiles`);
                    }}
                />
            </div>
            <FooterNav />
        </div>
    );
};
export default Search;