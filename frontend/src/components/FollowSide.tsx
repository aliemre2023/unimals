import { Sidebar } from "primereact/sidebar";
import { useState, useEffect } from "react";
import ProfilePhoto from "./ProfilePhoto";

interface FollowSideProps {
    user_id: string;
    visible: boolean;
    onClose: () => void;
}

const FollowSide: React.FC<FollowSideProps> = ({user_id, visible: initialVisible, onClose}) => {
    const [visible, setVisible] = useState(initialVisible);
    const [followTable, setFollowTable] = useState<User[][]>([[], []]);
    const [follow_Both, setFollow_Both] = useState<User[]>([]);
    const [follow_JustByMe, setFollow_JustByMe] = useState<User[]>([]);
    const [follow_JustByIt, setFollow_JustByIt] = useState<User[]>([]);
    

    useEffect(() => {
        setVisible(initialVisible);
        fetchFollowInfo(user_id);
    }, [initialVisible, user_id]);

    const fetchFollowInfo = async (user_id: string) => {
        const response = await fetch(`https://unimals-backend.vercel.app/api/users/${user_id}/follow_table`);
        if (!response.ok) throw new Error('Failed to fetch follow info');

        const data = await response.json();
        console.log(data);
        setFollowTable(data);
        sortFollowTable(data);
    }


    const sortFollowTable = (followTable: User[][]) => {
        const followers = followTable[0];
        const followings = followTable[1];

        const both: User[] = [];
        const justByMe: User[] = [];
        const justByIt: User[] = [];

        followers.forEach(follower => {
            const isFollowing = followings.some(following => following.id === follower.id);
            if (isFollowing) {
                both.push(follower);
            } else {
                justByIt.push(follower);
            }
        });

        followings.forEach(following => {
            const isFollower = followers.some(follower => follower.id === following.id);
            if (!isFollower) {
                justByMe.push(following);
            }
        });

        setFollow_Both(both);
        setFollow_JustByMe(justByMe);
        setFollow_JustByIt(justByIt);

        console.log(both);
        console.log(justByMe);
        console.log(justByIt);

    }

    return (
        <div className="flex justify-end p-4">
            <Sidebar
                visible={visible}
                position="right"
                onHide={() => {
                    setVisible(false);
                    onClose();
                }}
                className="lg:w-6 md:w-6 w-12"
            >
                <div className="flex w-12">
                    <div className="w-6 flex align-items-center justify-content-center m-2 p-2 bg-blue-100 border-round-md font-bold">
                        Followers
                        
                    </div>
                    <div className="w-6 flex align-items-center justify-content-center m-2 p-2 bg-blue-100 border-round-md font-bold">
                        Followings
                    </div>
                </div>
                
                <div className="w-12 flex justify-content-center">
                    <div className="w-3"></div>
                    <div className="w-6">
                        {follow_Both && follow_Both.map((follower: any) => (
                            <div className="flex bg-green-100 m-1 p-1 border-round-md" key={follower.id}>
                                <ProfilePhoto img={follower.profile_photo} height={"30"} thick_border={false} type={"profiles"} id={follower.id} />
                                <div className="p-2">{follower.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className="w-3"></div>
                </div>
                <div className="flex w-12">
                    <div className="w-6">
                        {follow_JustByIt && follow_JustByIt.map((follower: any) => (
                            <div className="flex bg-yellow-100 m-1 p-1 border-round-md" key={follower.id}>
                                <ProfilePhoto img={follower.profile_photo} height={"30"} thick_border={false} type={"profiles"} id={follower.id} />
                                <div className="p-2">{follower.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className="w-6">
                        {follow_JustByMe && follow_JustByMe.map((following: any) => (
                            <div className="flex bg-red-100 m-1 p-1 border-round-md" key={following.id}>
                                <ProfilePhoto img={following.profile_photo} height={"30"} thick_border={false} type={"profiles"} id={following.id} />
                                <div className="p-2">{following.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Sidebar>
        </div>
    )
}

export default FollowSide;