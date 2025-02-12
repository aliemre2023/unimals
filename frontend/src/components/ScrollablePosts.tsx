import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import ProfilePhoto from './ProfilePhoto';
import PostVisualize from "../components/PostVisualize";
import useAuth from './UseAuth';
import { useRouter } from 'next/router';

interface UserReaction {
    post_id: number | string;
    is_like: boolean;
}

interface ScrollablePostsListProps {
    width: string;
}

const ScrollablePostsList: React.FC<ScrollablePostsListProps> = ({width}) => {
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPostVisible, setIsPostVisible] = useState(false);
    const [idPostVisible, setIdPostVisible] = useState<number | string>();
    const router = useRouter();
    const [userReactions, setUserReactions] = useState<UserReaction[]>([]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/post/latest`)
            .then((response) => {
                const data = response.json();
                console.log(data);
                return data;
            })
            .then((data) => {
                setLatestPosts(data);
            })
        handleUserReactions();
    }, []);

    const handleUserReactions = async () => {
        const storedUserId = localStorage.getItem('userId');
        console.log(storedUserId);
        if (!storedUserId) {
            return;
        }

        const response = await fetch(`http://127.0.0.1:5000/api/users/posts/like?user_id=${storedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users like post');

        const data = await response.json();
        setUserReactions(data);
        console.log(userReactions);
    }

    const handleLike = async (postId: number | string) => {
        if (isLoading) return;
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/posts/${postId}/like`, {
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
            setIsLoading(false);
        }
    };

    const handleDislike = async (postId: number | string) => {
        if (isLoading) return;
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        setIsLoading(true);
        try {
            console.log("postid: ", postId);
            console.log("userid: ", storedUserId);

            const response = await fetch(`http://127.0.0.1:5000/api/posts/${postId}/dislike`, {
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
            setIsLoading(false);
        }
    };

    const handleMessage = async (postId: number | string) => {
        if (isLoading) return;
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

    return (
        <div className={`${width} bg-gray-400 scrollable justify-content-center`}>
            {
                <ul className='m-4'>
                    {latestPosts.map((post) => (
                        <li key={post.id}
                            className='border-solid border-2 border-primary-500 surface-overlay p-6 m-3 pb-1 pt-1 border-round-md'>
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
                        </li>
                    ))}
                    <li className='bottom-fixer'>
                        <p>END OF PAGE</p>
                        <br></br>
                        <p>take a break</p>
                        <br></br>
                        <br></br>
                        <br></br>
                        <p>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠤⠒⠈⠉⠉⠉⠉⠒⠀⠀⠤⣀⠀⠀⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠁⠀⠀⠀⠀⠀⠀⢀⣄⠀⠀⠀⠀⠑⡄⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠰⠿⠿⠿⠣⣶⣿⡏⣶⣿⣿⠷⠶⠆⠀⠀⠘⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠠⠴⡅⠀⠀⠠⢶⣿⣿⣷⡄⣀⡀⡀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀<br></br>
                        ⠀⣰⡶⣦⠀⠀⠀⡰⠀⠀⠸⠟⢸⣿⣿⣷⡆⠢⣉⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀<br></br>
                        ⠀⢹⣧⣿⣇⠀⠀⡇⠀⢠⣷⣲⣺⣿⣿⣇⠤⣤⣿⣿⠀⢸⠀⣤⣶⠦⠀⠀⠀⠀<br></br>
                        ⠀⠀⠙⢿⣿⣦⡀⢇⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀⡜⣾⣿⡃⠇⢀⣤⡀⠀<br></br>
                        ⠀⠀⠀⠀⠙⢿⣿⣮⡆⠀⠙⠿⣿⣿⣾⣿⡿⡿⠋⢀⠞⢀⣿⣿⣿⣿⣿⡟⠁⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠛⢿⠇⣶⣤⣄⢀⣰⣷⣶⣿⠁⡰⢃⣴⣿⡿⢋⠏⠉⠁⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠠⢾⣿⣿⣿⣞⠿⣿⣿⢿⢸⣷⣌⠛⠋⠀⠘⠀⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠙⣿⣿⣿⣶⣶⣿⣯⣿⣿⣿⣆⠀⠇⠀⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣯⡙⢿⣿⣿⠟⡁⠰⡀⠀⠀⠀⠀⠀<br></br>
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⡟⠈⢩⣥⣾⣷⠐⡌⠙⠃⠀  <br></br>
                        </p>

                    </li>
                </ul>
            }
            <PostVisualize post_id={idPostVisible as string} visible={isPostVisible} onClose={handleMessageClose}/>
        </div>
      
    );
  };
  
  export default ScrollablePostsList;