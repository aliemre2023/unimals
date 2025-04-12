import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useRouter, } from 'next/router';
import useDecode from '../hooks/useDecode';

// custom icon
const customIcon = new L.Icon({
  iconUrl: '/map_pointer.png',
  iconSize: [25, 30], 
  iconAnchor: [12, 41],
  popupAnchor: [1, -34], 
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41], // Size of the shadow
});

// Component to handle map clicks and add markers
const AddMarkerOnClick = ({ setMarker }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarker([lat, lng]);
      },
    });
    return null;
};

const MyMapComponent = ({animalImgUrl}) => {
    const position = [41.102987, 29.027938]; // Latitude and Longitude for the marker
    const [marker, setMarker] = useState(null); 
    const router = useRouter();
    const { id } = router.query;
    const {storedUserId, isLoading} = useDecode();
    const [last10point, setLast10Point] = useState([]);

    console.log(animalImgUrl);
    const animalIcon = new L.Icon({
        iconUrl: animalImgUrl,
        iconSize: [25, 41], 
        iconAnchor: [12, 41],
        popupAnchor: [1, -34], 
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        shadowSize: [41, 41], // Size of the shadow
    });

    useEffect(() => {
        const fetchLast10Points = async () => {
          try {
            const response = await fetch(`https://unimals-backend.vercel.app/api/animals/${id}/get/point10`);
            if (response.ok) {
              const data = await response.json();
              setLast10Point(data);
            } else {
              console.error('Failed to fetch last 10 points');
            }
          } catch (error) {
            console.error('Error fetching last 10 points:', error);
          }
        };
    
        if (id) {
          fetchLast10Points();
        }
      }, [id]);
    

    const handleSaveButton = async () => {
        if(!storedUserId){
            router.push("/profile")
            return;
        }
        const [latitude, longitude] = marker;
        const response = await fetch(`https://unimals-backend.vercel.app/api/animals/${id}/add/point`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: storedUserId,
                latitude,
                longitude,
            }),
        });
        if (response.ok) {
            alert('Animal point saved successfully!');
        } 
        else {
            alert('Failed to save Animal point. Please try again.');
        }
    }

    return (
        <div className=''>
            <div className='flex p-3 m-3 mb-1 pb-1'>
                <div className='w-4'></div>
                <div className='w-4 flex align-items-center justify-content-center'>
                    {marker ?
                    <div 
                        className='w-12'
                        style={{ textAlign: 'center' }}
                    > 
                        <Button 
                            className="w-12 bg-green-600 border-0 border-blue-100 align-items-center justify-content-center m-1"
                            onClick={handleSaveButton}
                        >
                            Save Marker
                        </Button>
                        <div>{marker[0].toFixed(4)} , {marker[1].toFixed(4)}</div>
                    </div>
                    :
                    <div 
                        className='w-12'
                        style={{ textAlign: 'center' }}
                    > 
                        <Button 
                            className="w-12 bg-green-200 border-0 border-blue-100 align-items-center justify-content-center m-1"
                            
                        >
                            Mark a place
                        </Button>
                        <div>{0} , {0}</div>
                    </div>
                    }
                </div>
                <div className='w-4'></div>
            </div>

            <div className='flex m-3 p-3 pt-1 mt-1'>
                <div className='w-1'></div>
                <div className='w-10 border-3 border-white'>
                    <MapContainer center={position} zoom={16} style={{ height: '70vh', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <AddMarkerOnClick setMarker={setMarker} />
                        {marker && (
                            <Marker position={marker} icon={customIcon}>
                                <Popup>
                                    Marker at {marker[0].toFixed(4)}, {marker[1].toFixed(4)}
                                </Popup>
                            </Marker>
                        )}
                        {last10point.map((point, index) => (
                            <Marker
                                key={index}
                                position={[point.latitude, point.longitude]}
                                icon={animalIcon}
                            >
                                {
                                /*
                                <Popup>
                                Last Point: {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)} <br />
                                Timestamp: {point.timestamp}
                                </Popup>
                                */
                                }
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
                <div className='w-1'></div>
            </div>
            
        </div>
    );
};

export default MyMapComponent;