interface Animal {
    id: string | number;
    name: string;
    kind: string
    profile_photo?: string;
    like_count: number;
    dislike_count: number;
    university_name: string;
    university_abbreviation: string;
    goody_score: number;
    posts: Post[];
    comments: CommentAnimal[];
}