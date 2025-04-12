import React, { useState, useEffect } from 'react';
import FooterNav from '../../components/FooterNav';
import ProfilePhoto from '../../components/ProfilePhoto';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import GridPosts from '../../components/GridPosts';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie'
import { jwtDecode } from "jwt-decode";
import useDecode from '../../hooks/useDecode';
import GridAnimals from '../../components/GridAnimals';
import FollowSide from '../../components/FollowSide';

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
    const [grid, setGrid] = useState('post');

    const [forgotButtonLabel, setForgotButtonLabel] = useState('forgot my password');
    const [forgot_mail, setForgotMail] = useState('');
    const [forgotPasswordClicked, setForgotPasswordClicked] = useState<boolean>(false);
    const [forgotMessage, setForgotMessage] = useState('');

    const {storedUserId, isLoading} = useDecode();
    useEffect(() => {
        if(!isLoading && storedUserId){
            setUserId(storedUserId as string);
            fetchUserInfo(storedUserId);
        }
    }, [storedUserId, isLoading]);

    const fetchUserInfo = async (userId: string) => {
        try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/users/${userId}`);
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
        const response = await fetch('https://unimals-backend.vercel.app/api/login', {
            credentials: 'include',
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
           
            const token = data.token;
            if(token){
                Cookies.set('session_token', token, {expires: 7, path: '/'});

                const decodedToken: any = jwtDecode(token as any);
                const storedUserId = decodedToken.user_id;
                if (storedUserId) {
                    setUserId(storedUserId);
                    fetchUserInfo(storedUserId);
                }

                setSuccessMessage('Login successful.');
                setErrorMessage('');

                setTimeout(() => {
                    fetchUserInfo(storedUserId);
                }, 1000);
            }
            else {
                console.error('Token not found');
            }
        } 
        else {
            const errorData = await response.json();
            setFalseMessage(errorData.error);
        }
    };

    const handleSignUp = async () => {
        const response = await fetch('https://unimals-backend.vercel.app/api/signup', {
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

        if (response.ok) {
            const data = await response.json();
            setSuccessMessage("Congratulations! Account created.");
        } 
        else {
            const errorData = await response.json();
            setErrorMessage(errorData.error);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            Cookies.remove("session_token");
        }
        setUserId('');
        setUserInfo([]);
        setLoggedOutMessage('Logged out successfully.');
    };

    const handleEditting = () => {
        setEditting(!editting);
    };

    const handleGridPost = () => {
        setGrid('post');  
    };
    const handleGridAnimal = () => {
        setGrid('animal');
    };

    const sendMail = async (forgot_mail: string) => {
        setForgotMessage("Mail sending...")
        try{
            const response = await fetch(`https://unimals-backend.vercel.app/api/forgotmypassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email: forgot_mail})
            });
            const data = await response.json();

            setForgotMessage(data.response_message)
        }
        catch{
            setForgotMessage("An issue occurred when mail try to send!")
        }
    }

    const handleForgotPassword = () => {
        if(!forgotPasswordClicked){
            setForgotPasswordClicked(true);
            setForgotButtonLabel('Send Mail');
        }
        else{
            if(!forgot_mail || forgot_mail == ""){
                setForgotMessage('Fill required area');
            }
            else{
                sendMail(forgot_mail);
                //setForgotMessage('Mail sended');
            }
            console.log(forgot_mail);
        }
        
    }

    const [isFollowSideVisible, setIsFollowSideVisible] = useState<boolean>(false);
    const handleFollowSideClose = () => {
        setIsFollowSideVisible(false);
    }
    const handleFollowSideOpen = () => {
        setIsFollowSideVisible(true);
    }

    if (!userId) {
        return (
            <div className="w-full max-w-6xl mx-auto">
        
                {/* Forms Container */}
                <div className="scrollable md:flex flex-col md:flex-row justify-center items-stretch">
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

                            <div className='mt-7'>
                                {forgotPasswordClicked &&
                                    <div>
                                        <InputText
                                            id="forgot_mail"
                                            value={forgot_mail}
                                            onChange={(e) => setForgotMail(e.target.value)}
                                            placeholder="Email"
                                            className="w-full"
                                        /> 
                                    </div>

                                }
                                <Button 
                                    className='w-6 mt-4'
                                    label={forgotButtonLabel}
                                    onClick={handleForgotPassword}
                                />
                                {forgotMessage && (
                                    <div className="mb-4 text-blue-500 mt-6">
                                        {forgotMessage}
                                    </div>
                                )}
                                
                            </div>
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
                <div className='flex md:flex p-3 bg-blue-700 relative'>
                    <ProfilePhoto 
                        img={userInfo.length > 0 && userInfo[0].user_profile_photo} 
                        height='250' 
                        thick_border={true} 
                        type={"profiles"}
                        id={userId as string}
                        
                    />
                    <div className='w-11 pl-3 text-center justify-content-center align-items-center'>
                        <div className='p-4 text-4xl'>
                        {userInfo.length > 0 && userInfo[0].user_name}
                        </div>
                        <div className='flex justify-content-around text-xl'>
                            <div>
                                <div>Post</div>
                                <div>{userInfo.length > 0 && userInfo[0].user_post_count}</div>
                            </div>
                            <div
                                className='cursor-pointer border-bottom-2 border-top-2 border-white p-1 border-round-md hover:border-blue-500'
                                onClick={handleFollowSideOpen}
                            >
                                <div>Takipçi</div>
                                <div>{userInfo.length > 0 && userInfo[0].user_follower_count}</div>
                            </div>
                            <div
                                className='cursor-pointer border-bottom-2 border-top-2 border-white p-1 border-round-md hover:border-blue-500'
                                onClick={handleFollowSideOpen}
                            >
                                <div>Takip</div>
                                <div>{userInfo.length > 0 && userInfo[0].user_following_count}</div>
                            </div>
                        </div>
                    </div>    
                </div>
                <div className='w-12 flex'>
                    <Button
                        className="w-4 p-button-danger m-1"
                        icon="pi pi-sign-out"
                        label=""
                        onClick={handleLogout}
                    />

                    <Button
                        className="w-4 bg-blue-900 m-1"
                        icon="pi pi-pencil"
                        label=""
                        onClick={handleEditting}
                    />
                    <Button
                        icon="pi pi-user-edit"
                        className="w-4 bg-red-800 m-1"
                        onClick={() => {
                            router.push("/profile/edit")
                        }}
                    />
                </div>

                <div className='w-12 flex'>
                    <Button
                        className="pi pi-image w-6 bg-blue-600 border-0 m-1"
                        onClick={handleGridPost}
                    >
                    </Button>
                    <Button
                        className="w-6 bg-blue-600 border-0 m-1 justify-content-center"
                        onClick={handleGridAnimal}
                    >
                        <img
                            src='/icon_dog_white.png'
                            width='20px'
                        />
                    </Button>
                </div>
                {grid == 'post' ?
                    <GridPosts user_id={userId} edit={editting} travelling={false}/>
                    :
                    <GridAnimals user_id={userId} edit={editting} travelling={false}/>
                }
            </div>
            <FollowSide user_id={userId} visible={isFollowSideVisible} onClose={handleFollowSideClose} />
            <FooterNav />
        </div>
    )
}
export default Profile;