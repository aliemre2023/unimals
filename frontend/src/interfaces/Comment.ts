interface Comment {
    id: number;
    post_id: number;
    user_id: string;
    comment: string;
    added_date: Date;
    like_count: number;
    dislike_count: number;
    user_name: string;
    user_profile_photo: string;
}