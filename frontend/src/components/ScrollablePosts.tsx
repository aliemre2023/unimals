import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import ProfilePhoto from './ProfilePhoto';
import PostVisualize from "../components/PostVisualize";
import { useRouter } from 'next/router';
import { Sidebar } from "primereact/sidebar";
import useDecode from '../hooks/useDecode';
import { ProgressSpinner } from 'primereact/progressspinner';       

interface UserReaction {
    post_id: number | string;
    is_like: boolean;
}

interface ScrollablePostsListProps {
    width: string;
    onScroll: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

const ScrollablePostsList: React.FC<ScrollablePostsListProps> = ({width, onScroll}) => {
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
    const [isPostVisible, setIsPostVisible] = useState(false);
    const [idPostVisible, setIdPostVisible] = useState<number | string>();
    const router = useRouter();
    const [userReactions, setUserReactions] = useState<UserReaction[]>([]);
    const [postAnimalsSidebar, setPostAnimalsSidebar] = useState<{ [key: number]: boolean }>({});
    const {storedUserId, isLoading} = useDecode();
    const scrollableDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`https://unimals-backend.vercel.app/api/post/latest`)
            .then((response) => {
                const data = response.json();
                return data;
            })
            .then((data) => {
                setLatestPosts(data);
            })
        handleUserReactions();
    }, [storedUserId]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollableDiv = scrollableDivRef.current;
            if (scrollableDiv) {
                const { scrollTop, scrollHeight, clientHeight } = scrollableDiv;
                onScroll(scrollTop, scrollHeight, clientHeight);
            }
        };

        const scrollableDiv = scrollableDivRef.current;
        if (scrollableDiv) {
            scrollableDiv.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (scrollableDiv) {
                scrollableDiv.removeEventListener('scroll', handleScroll);
            }
        };
    }, [onScroll]);

    const handleUserReactions = async () => {
        if (!storedUserId) {
            return;
        }

        const response = await fetch(`https://unimals-backend.vercel.app/api/users/posts/like?user_id=${storedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users like post');

        const data = await response.json();
        setUserReactions(data);
    }

    const handleLike = async (postId: number | string) => {
        if (isLoadingLike) return;
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        setIsLoadingLike(true);
        try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'user_id': storedUserId,
                })
            });
            
            if (!response.ok) throw new Error('Failed to like post');
            
            const data = await response.json();
            setLatestPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId 
                        ? { ...post, 
                            likeCount: data.like_count,
                            dislikeCount: data.dislike_count,
                        }
                        : post
                )
            );
            handleUserReactions();
        } catch (error) {
            console.error('Error liking post:', error);
        } finally {
            setIsLoadingLike(false);
        }
    };

    const handleDislike = async (postId: number | string) => {
        if (isLoadingLike) return;
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        setIsLoadingLike(true);
        try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/posts/${postId}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'user_id': storedUserId,
                })
            });
            
            if (!response.ok) throw new Error('Failed to dislike post');
            
            const data = await response.json();
            setLatestPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId 
                        ? { ...post, 
                            dislikeCount: data.dislike_count,
                            likeCount: data.like_count
                        }
                        : post
                )
            );
            handleUserReactions();
        } catch (error) {
            console.error('Error disliking post:', error);
        } finally {
            setIsLoadingLike(false);
        }
    };

    const handleMessage = async (postId: number | string) => {
        if (isLoadingLike) return;
        setIdPostVisible(postId);
        setIsPostVisible(true);
    };

    const handleMessageClose = () => {
        setIsPostVisible(false);
        setIdPostVisible("");
    };

    const getUserReaction = (postId: number | string) => {
        const reaction = userReactions.find(reaction => reaction.post_id === postId);
        return reaction ? reaction.is_like : null;
    };

    const handleSidebarToggle = (postId: number) => {
        setPostAnimalsSidebar(prevState => ({
            ...prevState,
            [postId]: !prevState[postId]
        }));
    };

    return (
        <div ref={scrollableDivRef} className={`${width} bg-gray-400 scrollable justify-content-center`}>
            {
                <ul className='m-4'>
                    { latestPosts.length == 0 ?
                    <li className='p-3 m-3'>
                        <ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="2" fill="#cbd5e0" animationDuration="1.1s" />
                    </li>
                    

                    :
                    latestPosts.map((post) => (
                        <li key={post.id}
                            className={`${postAnimalsSidebar[post.id as number] ? 'border-red-100' : 'border-primary-500'} border-solid border-2 surface-overlay p-6 m-3 pb-1 pt-1 border-round-md relative`}
                        >                      
                            <div className='absolute top-0 right-0'>
                                <Button 
                                    style={{ borderRadius: '0 2px 0 50px' , width: '40px', height: '40px' }}
                                    onClick={() => handleSidebarToggle(post.id as number)}
                                    className={postAnimalsSidebar[post.id as number] ? 'bg-red-100 border-red-100' : ''}
                                >
                                    <img src="/icon_dog.png" 
                                        alt="Animal Icon" 
                                        style={{ width: '16px', height: '16px' }} 
                                        className='-mt-1'
                                    />
                                </Button>
                            </div>
                            <div className='w-12 xl:flex lg:flex md:flex sm:flex align-items-center'>
                                <ProfilePhoto img={post.user_profilePhoto} height='50' thick_border={false} type={"profiles"} id={post.user_id}/>
                                <div className='p-2'>
                                    <div className='left-align text-xl font-bold'>{post.user_name}</div>
                                </div>
                            </div>
                            <div className='left-align p-1'>
                                {post.description}
                            </div> 
                            <img
                                src={post.image || "/default_post.jpg"}
                                alt={`${post.description}`}
                                className="w-12 sm:w-12 md:w-10 lg:w-8 xl:w-6 object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = '/default_post.jpg';
                                }}
                            />
                            <div className='flex mt-2 w-12 justify-content-center '>
                                <div className='justify-content-center flex'>
                                    <Button icon="pi pi-comment"
                                        className="p-button-rounded ml-3 like_dislike_comment_width" 
                                        onClick={() => handleMessage(post.id)}
                                    />
                                    {post.commentCount}
                                    <Button 
                                        icon={`pi ${getUserReaction(post.id) === true ? 'pi-thumbs-up-fill' : 'pi-thumbs-up'}`}
                                        className={`p-button-rounded ml-3 like_dislike_comment_width p-button-success`}
                                        onClick={() => handleLike(post.id)}
                                    />
                                    {post.likeCount}
                                    <Button 
                                        icon={`pi ${getUserReaction(post.id) === false ? 'pi-thumbs-down-fill' : 'pi-thumbs-down'}`}
                                        className={`p-button-rounded ml-3 like_dislike_comment_width p-button-danger`}
                                        onClick={() => handleDislike(post.id)}
                                    />
                                    {post.dislikeCount}
                                </div>  
                            </div>

                            {
                                postAnimalsSidebar[post.id as number] ?
                                <div className='w-12 absolute bottom-0 left-0'>
                                    <div className='w-6 bg-red-100 border-round-lg m-1 p-1'>
                                        {post.postsAnimal.map((animal) => (
                                            <div 
                                                key={animal.id as number} 
                                                className='flex align-items-center p-1 m-1 bg-blue-100 border-round-md cursor-pointer'
                                                onClick={() => {
                                                    router.push(`/animals/${animal.id}`)
                                                }}
                                            >
                                                <ProfilePhoto img={animal.profile_photo as string} height='30' thick_border={false} type={"animals"} id={animal.id as string}/>
                                                <div className='ml-2'>{animal.name as string}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div> 
                                :
                                <div
                                    className='w-12 absolute right-0 justify-content-center align-items-center'
                                >
                                    
                                </div> 
                            }
                        </li>
                    ))}
                    <li className='bottom-fixer'>
                        <p>END OF PAGE</p>
                        <br></br>
                        <p>take a break</p>

                    </li>
                </ul>
            }
            <PostVisualize post_id={idPostVisible as string} visible={isPostVisible} onClose={handleMessageClose}/>
        </div>
      
    );
  };
  
  export default ScrollablePostsList;