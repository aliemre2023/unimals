import React, { useState, useEffect } from 'react';
import FooterNav from '../../../components/FooterNav';
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import useAuth from '../../../hooks/useAuth';

const add = () => {
    useAuth();
    
    const router = useRouter()

    return (
        <div className="w-full justify-content-center">
            <div className='w-12 flex text-4xl p-3 bg-blue-700 align-items-center justify-content-center'>
                UNIMALS
            </div>    
            <div className='w-12 flex align-items-center justify-content-center p-8'>
                <Button
                    className="w-1 p-1 bg-primary text-center mr-3 ml-3 justify-content-center"
                    label="New Post"
                    onClick={() => {
                        router.push('add/postAdd');
                    }}
                />
                <Button
                    className="w-1 p-1 bg-primary text-center mr-3 ml-3 justify-content-center"
                    label="New Animal"
                    onClick={() => {
                        router.push('add/animalAdd');
                    }}
                />
                <Button
                    className="w-1 p-1 bg-primary text-center mr-3 ml-3 justify-content-center"
                    label="New Room"
                    onClick={() => {
                        router.push('add/roomAdd');
                    }}
                />
            </div>
            
            <FooterNav />
        </div>
    )
}
export default add;