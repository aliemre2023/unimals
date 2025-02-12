import React, { useState, useEffect } from 'react';
import FooterNav from '../../components/FooterNav';
import ProfilePhoto from '../../components/ProfilePhoto';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import GridPosts from '../../components/GridPosts';
import { useRouter } from 'next/router';

const Profile = () => {
    const [userInfo, setUserInfo] = useState<any[]>([]);
    
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [login_username, setLoginUsername] = useState('');
    const [login_password, setLoginPassword] = useState('');
    const [signup_username, setSignupUsername] = useState('');
    const [signup_email, setSignupEmail] = useState('');
    const [signup_password, setSignupPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [falseMessage, setFalseMessage] = useState('');
    const [loggedOutMessage, setLoggedOutMessage] = useState('');
    const [editting, setEditting] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
                setUserId(storedUserId);
                fetchUserInfo(storedUserId);
            }
        }
    }, []);

    const fetchUserInfo = async (userId: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserInfo(data);
            } else {
                console.error('Failed to fetch user info');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const handleLogin = async () => {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: login_username,
                password: login_password,
            }),
        });
        setFalseMessage("");
        setLoggedOutMessage("");

        if (response.ok) {
            const data = await response.json();
            setUserId(data.user_id);
            localStorage.setItem('userId', data.user_id); 

            setSuccessMessage('Login successful.');
            setErrorMessage('');

            setTimeout(() => {
                fetchUserInfo(data.user_id);
            }, 1000);
        } 
        else {
            const errorData = await response.json();
            setFalseMessage(errorData.error);
        }
    };

    const handleSignUp = async () => {
        const response = await fetch('http://127.0.0.1:5000/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: signup_username,
                email: signup_email,
                password: signup_password,
            }),
        });
        setErrorMessage("");
        setSuccessMessage("");

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response:', response);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            setSuccessMessage("Congratulations! Account created.");
        } 
        else {
            const errorData = await response.json();
            setErrorMessage(errorData.error);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userId'); // Remove userId from localStorage
        }
        setUserId('');
        setUserInfo([]);
        setLoggedOutMessage('Logged out successfully.');
    };

    const handleEditting = () => {
        setEditting(!editting);
    };

    const updateProfilePhoto = async (user_id: string, new_pp: string) => {
        const response = await fetch(`http://127.0.0.1:5000/api/users/${user_id}/update/profile_photo/${new_pp}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log(`${user_id} ppp updated successfully`);
        } 
        else {
            console.error(`Failed to update user pp: ${new_pp}`);
        }
        
    };

    if (!userId) {
        return (
            <div className="w-full max-w-6xl mx-auto">
        
                {/* Forms Container */}
                <div className="flex flex-col md:flex-row justify-center items-stretch">
                    {/* Login Form */}
                    <div className="w-full md:w-1/2 flex justify-center p-8 border-b md:border-b-0 md:border-r">
                        <div className="w-full max-w-md space-y-4 text-center">
                        <div className="text-lg font-medium mb-4">Login</div>
                        <InputText
                            id="login_username"
                            value={login_username}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full"
                        />
                        <InputText
                            id="login_password"
                            value={login_password}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Password"
                            type="password"
                            className="w-full"
                        />
                        <Button
                            className="w-full mt-4"
                            icon="pi pi-sign-in"
                            label="Login"
                            onClick={handleLogin}
                        />
                        {falseMessage && (
                            <div className="mb-4 text-red-500 mt-6">
                                {falseMessage}
                            </div>
                        )}
                        {loggedOutMessage && (
                            <div className="mb-4 text-green-500 mt-6">
                                {loggedOutMessage}
                            </div>
                        )}
                        </div>
                    </div>
        
                    {/* Sign Up Form */}
                    <div className="w-full md:w-1/2 flex justify-center p-8">
                        <div className="w-full max-w-md space-y-4 text-center">
                        <div className="text-lg font-medium mb-4">Sign Up</div>
                        <InputText
                            id="signup_username"
                            value={signup_username}
                            onChange={(e) => setSignupUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full"
                        />
                        <InputText
                            id="signup_email"
                            value={signup_email}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full"
                        />
                        <InputText
                            id="signup_password"
                            value={signup_password}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Password"
                            type="password"
                            className="w-full"
                        />
                        <Button
                            className="w-full mt-4"
                            icon="pi pi-user-plus"
                            label="Sign Up"
                            onClick={handleSignUp}
                        />

                        {successMessage && (
                            <div className="mb-4 text-green-500 mt-6">
                                {successMessage}
                            </div>
                        )}
                        {errorMessage && (
                            <div className="mb-4 text-red-500 mt-6">
                                {errorMessage}
                            </div>
                        )}
                        </div>
                    </div>
                </div>
        
                <FooterNav />
            </div>       
        );
    }

    return (
        <div className="w-full">
            <div className='scrollable'>
                <div className='lg:flex md:flex p-3 bg-blue-700'>
                    <ProfilePhoto 
                        img={userInfo.length > 0 && userInfo[0].user_profile_photo} 
                        height='250' 
                        thick_border={true} 
                        type={"profiles"}
                        id={userId as string}
                        
                    />
                    <div className="p-4 md:p-0 sm:p-0">
                        <Button
                            className="p-button-danger m-1"
                            icon="pi pi-sign-out"
                            label=""
                            onClick={handleLogout}
                        />

                        <Button
                            className="bg-blue-900 m-1"
                            icon="pi pi-pencil"
                            label=""
                            onClick={handleEditting}
                        />
                        {editting && (
                        <div>
                            <Button
                                icon="pi pi-user-edit"
                                className=" bg-red-800 m-1"
                                onClick={() => {
                                    router.push("/profile/edit")
                                }}
                            />
                        </div>   
                    )}
                    </div>
                    <div className='w-11 pl-3 text-center justify-content-center align-items-center'>
                        <div className='p-4 text-4xl'>
                        {userInfo.length > 0 && userInfo[0].user_name}
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
                <GridPosts user_id={userId} edit={editting} travelling={false}/>
                </div>
            <FooterNav />
        </div>
    )
}
export default Profile;