import { Button } from 'primereact/button';
import { useRouter } from 'next/router';

const FooterNav = () => {
  const router = useRouter();

  return (
    <div className='w-12 footer-height flex justify-content-center bottom-0 fixed p-3 bg-blue-700'>
      <Button
        className="w-1 p-1 bg-primary text-center mr-3 ml-3"
        onClick={() => {
          router.push('/');
        }}
        icon="pi pi-home"
      />
      <Button
        className="w-1 p-1 bg-primary text-center mr-3 ml-3"
        onClick={() => {
          router.push('/rooms');
        }}
        icon="pi pi-envelope"
      />
      <Button
        className="p-button-outlined p-button-lg"
        onClick={() => {
          router.push('/profile/add');
        }} 
        icon="pi pi-plus"/>
      <Button
        className="w-1 p-1 bg-primary text-center mr-3 ml-3 justify-content-center"
        onClick={() => {
          router.push('/search');
        }}
        icon="pi pi-search"
      />
      {/*<img src={'/icon_dog.png'} alt="Dog Icon" style={{ width: '20px', height: '20px' }}></img>
      </Button>*/}
      <Button
        className="w-1 p-1 bg-primary text-center mr-3 ml-3"
        onClick={() => {
          router.push('/profile');
        }}
        icon="pi pi-user"
      />
    </div>
  );
};

export default FooterNav;