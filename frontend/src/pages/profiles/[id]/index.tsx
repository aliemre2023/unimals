import React, { useState, useEffect } from 'react';
import FooterNav from '../../../components/FooterNav';
import ProfilePhoto from '../../../components/ProfilePhoto';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import GridPosts from '../../../components/GridPosts';
import { useRouter } from 'next/router';

const ProfileId: React.FC = () => {
    const router = useRouter();
    const { id } = router.query; 
    
    const [userInfo, setUserInfo] = useState<any[]>([]);
    const [storedUserId, setStoredUserId] = useState(''); 
    const [storedUserFollowsIt, setStoredUserFollowsIt] = useState<boolean>();
    
    useEffect(() => {
        if (id) {
            fetchUserInfo(id as string);
        }
    }, [id]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
                setStoredUserId(storedUserId);
            }
        }
    }, []);

    useEffect(() => {
        if (userInfo.length > 0 && storedUserId) {
            if (userInfo[0].followers.includes(parseInt(storedUserId))) {
                console.log("INN");
                setStoredUserFollowsIt(true);
            } else {
                console.log("OUT");
                setStoredUserFollowsIt(false);
            }
        }
    }, [userInfo, storedUserId]);

    const fetchUserInfo = async (userId: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserInfo(data);
                console.log(data);

                if (data[0].followers.includes(parseInt(storedUserId))) {
                    console.log("INN");
                    setStoredUserFollowsIt(true);
                } else {
                    console.log("OUT");
                    setStoredUserFollowsIt(false);
                }
            } 
            else {
                console.error('Failed to fetch user info');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const handleFollow = async (currentUserId: string, userId: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/follow/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentUserId, userId })
            });
            if (response.ok) {
                console.log('Follow user');
                setStoredUserFollowsIt(true);
                fetchUserInfo(userId); // Refresh user info
            } else {
                console.error('Failed to follow user');
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const handleUnfollow = async (currentUserId: string, userId: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/follow/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentUserId, userId })
            });
            if (response.ok) {
                console.log('Unfollow user');
                setStoredUserFollowsIt(false);
                fetchUserInfo(userId); // Refresh user info
            } 
            else {
                console.error('Failed to unfollow user');
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };

    return (
        <div className="w-full">
            <div className='lg:flex md:flex p-3 bg-blue-700'>
                <ProfilePhoto img={userInfo.length > 0 && userInfo[0].user_profile_photo} height='250' thick_border={true} type={"profiles"} id={id as string}/>
                <div className='w-11 pl-3 text-center justify-content-center align-items-center'>
                    <div className='p-4 text-4xl flex justify-content-center'>
                        {userInfo.length > 0 && userInfo[0].user_name} 
                        {storedUserFollowsIt ? (
                            <Button 
                                icon="pi pi-user-minus"
                                className="p-button-rounded p-button-danger p-mr-2 ml-2"
                                onClick={() => handleUnfollow(storedUserId, id as string)}
                            />
                        ) : (
                            <Button 
                                icon="pi pi-user-plus"
                                className="p-button-rounded p-button-success p-mr-2 ml-2"
                                onClick={() => {handleFollow(storedUserId, id as string)}}
                            />
                        )}
                    </div>
                    <div className='flex justify-content-around text-xl'>
                        <div>
                            <div>Post</div>
                            <div>{userInfo.length > 0 && userInfo[0].user_post_count}</div>
                        </div>
                        <div>
                            <div>Takipçi</div>
                            <div>{userInfo.length > 0 && userInfo[0].user_follower_count}</div>
                        </div>
                        <div>
                            <div>Takip</div>
                            <div>{userInfo.length > 0 && userInfo[0].user_following_count}</div>
                        </div>
                    </div>
                    
                </div>    
            </div>
            <GridPosts user_id={id as string} edit={false} travelling={true}/>
            <FooterNav />
        </div>
    )
}
export default ProfileId;