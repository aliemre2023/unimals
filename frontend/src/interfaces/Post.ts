interface Post {
    id: number | string;
    user_id: string;
    user_name: string;
    user_profilePhoto: string;
    description: string;
    image: string;
    postedDate: string;
    likeCount: number;
    dislikeCount: number;
    commentCount: number;
    postsAnimal: number[];
}