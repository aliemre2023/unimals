import { useRouter } from 'next/navigation';
import router from 'next/router';
import { Image } from 'primereact/image';

interface ProfilePhotoProps {
    img: string;
    height: string;
    thick_border: boolean;
    type: string;
    id: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({img, height, thick_border, type, id}) => {
    const router = useRouter();
    return (
        <div 
            style={{height: `${height}px` }} 
            // <div className={`max-w-max min-w-min max-h-min border-circle rounded-full bg-blue-300 overflow-hidden ${thick_border ? 'thick-black-border hidden md:block' : ''}`}>
            className={`max-w-max min-w-max max-h-min border-circle rounded-full bg-blue-300 overflow-hidden ${thick_border ? 'thick-black-border hidden md:block' : ''}`}
        >
            <img
                src={img || '/default_avatar.png'}
                alt="Default Avatar"
                className="h-full w-full cursor-pointer object-cover "
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/default_avatar.png';
                }}
                onClick={() => {
                    if(type != "rooms"){
                        router.push(`/${type}/${id}`);
                    }
                }}
                
            />
        </div>
    );  
};

export default ProfilePhoto;