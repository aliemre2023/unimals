import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';

interface GridPostProps {
    user_id: string;
    edit: boolean;
    travelling: boolean;
}

const GridPosts: React.FC<GridPostProps> = ({user_id, edit, travelling}) => {
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchUserPosts(user_id);
    }, [user_id]);

    const fetchUserPosts = async (user_id: string) => {
        try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/users/${user_id}/posts`);
            if (response.ok) {
                const data = await response.json();
                setUserPosts(data);
            } else {
                console.error('Failed to fetch user posts');
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
        }
    };

    const handleDeletePost = async (post_id: string, user_id: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/posts/${post_id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            fetchUserPosts(user_id);
        } 
        else {
            console.error('Failed to delete post');
        }
        
    };

    return (
        <div className='grid-container bottom-fixer'
        >
            {userPosts.length == 0 && !travelling && (
                <div className='grid-item flex align-items-center justify-content-center bg-blue-100 p-8'>
                    <Button
                        icon="pi pi-plus"
                        className="p-button-rounded p-button-lg fixed p-5"
                        onClick={() => {
                            router.push(`/profile/add/postAdd`);
                        }}
                    />
                </div>   
            )}

            {userPosts.map((post) => (
                <div className='grid-item'>
                    {edit && (
                        <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-sm p-button-danger p-absolute p-top-0 p-right-0"
                            onClick={() => 
                                handleDeletePost(post.post_id, user_id)
                            }
                        />
                    )}
                    <p className='pt-0 p-2'>{post.post_description}</p>
                    <div key={post.id} className=' flex align-items-center justify-content-center'>
                        
                        <img
                            src={post.post_image || "/default_post.jpg"}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                                e.currentTarget.src = "/default_post.jpg";
                            }}
                        />
                    </div>
                    <div className='w-12 flex justify-conntent-center'>
                        <p className='pb-0 p-2 w-12 text-center font-italic text-xs'>{post.post_posted_date}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GridPosts;