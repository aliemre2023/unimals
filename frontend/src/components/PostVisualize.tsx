import { useState, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import Profile from "../pages/profile";
import ProfilePhoto from "./ProfilePhoto";
import { useRouter } from 'next/router';
import useDecode from "../hooks/useDecode";

interface PostVisualizeProps {
    post_id: string;
    visible: boolean;
    onClose: () => void;
}

const PostVisualize: React.FC<PostVisualizeProps> = ({ post_id, visible: initialVisible , onClose}) => {
    const [visible, setVisible] = useState(initialVisible);
    const [newComment, setNewComment] = useState<string>('');
    const [comments, setComments] = useState<Comment[]>([]);
    //const [storedUserId, setStoredUserId] = useState<string | null>(null);
    const {storedUserId, isLoading} = useDecode();
    const router = useRouter();

    const fetchComments = async (post_id: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/posts/${post_id}/comments`);
        const data = await response.json();
        setComments(data);
    };

    const addNewComment = async () => {
        if(newComment.length == 0){
            return;
        }
        if(!storedUserId){
            router.push('/profile')
            return;
        }

        const newCommentInfo = {
            user_id: storedUserId,
            comment: newComment,
        };
        const response = await fetch(`https://unimals-backend.vercel.app/api/posts/${post_id}/comments/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCommentInfo)
        });
        const data = await response.json();
        setNewComment('');

        fetchComments(post_id);
    };


    useEffect(() => {
        setVisible(initialVisible);
        fetchComments(post_id as string);
    }, [initialVisible, post_id, storedUserId]);

    return (
        <div className="flex justify-end p-4">
            <Sidebar
                visible={visible}
                position="right"
                onHide={() => {
                    setVisible(false);
                    onClose();
                }}
                className="w-6"
            >
                <h2 className="text-xl font-semibold justify-content-center flex">Comments</h2>
                <span className="p-input-icon-left w-12 justify-content-center flex p-1">
                    <InputTextarea 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Enter comment" 
                        className="p-inputtext p-component w-12"
                        rows={1}
                        autoResize
                    />
                    <Button 
                        className="bg-green-300"
                        icon="pi pi-send"
                        onClick={() => {addNewComment()}}
                    />
                </span>
                <div id="comments">
                    {comments.map((comment) => (
                        <div key={comment.id} className="p-2">
                            <div className="flex">
                                <ProfilePhoto img={comment.user_profile_photo} height={"30"} thick_border={false} type={"profiles"} id={comment.user_id}/>
                                <div className="font-bold p-2">{comment.user_name}</div>
                            </div>
                            <p className="">{comment.comment}</p>
                            
                        </div>
                    ))}
                </div>
            </Sidebar>
        </div>
    );
};

export default PostVisualize;