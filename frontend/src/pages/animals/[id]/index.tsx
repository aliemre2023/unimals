import React, { use, useEffect, useState } from 'react';
import FooterNav from '../../../components/FooterNav';
import { InputText } from 'primereact/inputtext';
import ProfilePhoto from '../../../components/ProfilePhoto';
import GridPosts from '../../../components/GridPosts';
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { integer } from 'aws-sdk/clients/cloudfront';

const AnimalInfo = () => {
    const router = useRouter();
    const { id } = router.query;
    const [animalInfo, setAnimalInfo] = useState<Animal[]>([]);
    const [userReactions, setUserReactions] = useState<UserReaction[]>([]);


    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/animals?id=${id}`)
            .then((response) => response.json())

            .then((data) => {
                setAnimalInfo(data);
                console.log(data);
            });
        
        handleUserReactions();
    }, [id]);

    const handleUserReactions = async () => {
        const storedUserId = localStorage.getItem('userId');
        console.log(storedUserId);
        if (!storedUserId) {
            return;
        }

        const response = await fetch(`http://127.0.0.1:5000/api/users/animals/like?user_id=${storedUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users liked animals');

        const data = await response.json();
        setUserReactions(data);
        console.log(userReactions);
    }

    const handleLike = async (animalId: number) => {
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/animals/${animalId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'user_id': storedUserId,
                })
            });
            if (!response.ok) {
                console.error("Failed to fetch animal like")
            }

            const data = await response.json();
            setAnimalInfo((prevAnimalInfo) =>
                prevAnimalInfo.map((a) =>
                    a.id === animalId 
                        ? { ...a,
                            animal_likeCount: data.like_count,
                            animal_dislikeCount: data.dislike_count,
                        } : a
                )
            );
            handleUserReactions();           
        } catch (error) {
            console.error('Error liking the animal:', error);
        }
    };

    const handleDislike = async (animalId: number) => {
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            router.push('/profile');
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/animals/${animalId}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'user_id': storedUserId,
                })
            });
            if (!response.ok) throw new Error('Failed to dislike animal');
            
            const data = await response.json();
            setAnimalInfo((prevAnimalInfo) =>
                prevAnimalInfo.map((a) =>
                    a.id === animalId 
                        ? { ...a, 
                            animal_dislikeCount: data.dislike_count,
                            animal_likeCount: data.like_count
                        } : a
                )
            );
            handleUserReactions();
        } catch (error) {
            console.error('Error disliking the animal:', error);
        }
    };

    if (animalInfo.length === 0) {
        return <div>NO ANIMAL ID EXIST</div>
    }


    const animal = animalInfo[0];
    console.log("animal: ", animal);

    const getUserReaction = (postId: number | string) => {
        const reaction = userReactions.find(reaction => reaction.animal_id === postId);
        return reaction ? reaction.is_like : null;
    };

    return (
        <div className="w-full">
            <div className='scrollable'>
                <div className='lg:flex md:flex p-3 bg-blue-700'>
                    <ProfilePhoto img={animalInfo.length > 0 ? animal.profile_photo as string : '/default_avatar.png'} height='250' thick_border={true} type={"animals"} id={animal.id as string} />
                    <div className='w-11 pl-3 text-center justify-content-center align-items-center'>
                            <div className='p-4 text-4xl font-bold'>
                            {animalInfo.length > 0 && animal.name}
                            </div>
                            <div className='flex justify-content-around text-xl'>
                                <div>
                                    <div className='font-bold'>Post</div>
                                    <div>{animalInfo.length > 0 && animal.posts.length}</div>
                                </div>
                                <div>
                                    <div className='font-bold'>University</div>
                                    <div>{animalInfo.length > 0 ? animal.university_abbreviation : "None"}</div>
                                </div>
                                
                                <div>
                                    <div className='font-bold'>Goody Rate</div>
                                    {animalInfo && (
                                        <div>
                                            <div>
                                                {animal.dislike_count > 0
                                                    ? ((animal.like_count / (animal.dislike_count + animal.like_count)) * 100).toFixed(2)
                                                    : '100'}%
                                            </div>
                                            <div className='pt-2'>
                                                <Button 
                                                    icon={`pi ${getUserReaction(animal.id) === true ? 'pi-thumbs-up-fill' : 'pi-thumbs-up'}`}
                                                    className={`ml-3 like_dislike_comment_width p-button-success`}
                                                    onClick={() => handleLike(animal.id as number)}
                                                />
                                                <Button 
                                                    icon={`pi ${getUserReaction(animal.id) === false ? 'pi-thumbs-down-fill' : 'pi-thumbs-down'}`}
                                                    className={`ml-3 like_dislike_comment_width p-button-danger`}
                                                    onClick={() => handleDislike(animal.id as number)}
                                                />
                                            </div>
                                        </div>
                                        )
                                    }
                                </div>
                                
                            </div>
                        </div>    
                </div>

                <div className='grid-container'>

                    {animal.posts.map((post) => (
                        <div key={post.id} className='grid-item'> 
                            <div className=''>
                                <div className='w-12 flex align-items-center mb-1'>
                                    <ProfilePhoto img={post.user_profilePhoto} height='50' thick_border={false} type={"profiles"} id={post.user_id}/>
                                    <div className='font-bold ml-1'>{post.user_name}</div>
                        
                                </div>
                                <div className='mb-1'>{post.description}</div>  
                            </div>
                                    
                            <div key={post.id} className=' flex align-items-center justify-content-center'>  
                                <img
                                    src={post.image || "/default_post.jpg"}
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "/default_post.jpg";
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        
            <FooterNav />
        </div>
    );
};
export default AnimalInfo;