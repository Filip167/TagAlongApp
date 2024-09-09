import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Image, Modal } from 'react-bootstrap';
import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SearchIcon from '@mui/icons-material/Search';
import { GoogleMap, DirectionsRenderer, Autocomplete, Marker, useJsApiLoader } from '@react-google-maps/api';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import axios from 'axios';
import './NavbarCustom.css';

const libraries = ['places'];

const NavbarCustom = ({ setPostedRoutes }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false);
  const [isRouteShowing, setIsRouteShowing] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeInput, setActiveInput] = useState('');
  const [travelMode, setTravelMode] = useState('WALKING');
  const [roadDistance, setRoadDistance] = useState('');
  const [walkingTime, setWalkingTime] = useState('');
  const [joggingTime, setJoggingTime] = useState('');
  const [bikingTime, setBikingTime] = useState('');
  const [drivingTime, setDrivingTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      navigate('/login');
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  }, [navigate]);

  const handleMapClick = async (event) => {
    const latLng = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;

        if (activeInput === 'origin' && originInputRef.current) {
          setOriginMarker({ latLng, address });
          originInputRef.current.value = address;
        } else if (activeInput === 'destination' && destinationInputRef.current) {
          setDestinationMarker({ latLng, address });
          destinationInputRef.current.value = address;
        }
      } else {
        console.error('Error fetching address:', status);
        setErrorMessage('Error fetching address');
      }
    });
  };

  const handleMapRightClick = () => {
    setOriginMarker(null);
    setDestinationMarker(null);
    setDirectionsResponse(null);
    setIsRouteShowing(false);

    if (originInputRef.current) {
      originInputRef.current.value = '';
    }
    if (destinationInputRef.current) {
      destinationInputRef.current.value = '';
    }
  };

  const handleClearOrigin = () => {
    setOriginMarker(null);
    setDirectionsResponse(null);
    setIsRouteShowing(false);
    if (originInputRef.current) {
      originInputRef.current.value = '';
    }
  };

  const handleClearDestination = () => {
    setDestinationMarker(null);
    setDirectionsResponse(null);
    setIsRouteShowing(false);
    if (destinationInputRef.current) {
      destinationInputRef.current.value = '';
    }
  };

  const formatDistance = (distanceMiles) => {
    const miles = Math.floor(distanceMiles);
    const feet = Math.round((distanceMiles - miles) * 5280);
    return `${miles} miles, ${feet} feet`;
  };

  const formatTime = (hoursDecimal) => {
    const hours = Math.floor(hoursDecimal);
    const minutes = Math.round((hoursDecimal - hours) * 60);
    return `${hours} hr ${minutes} min`;
  };

  const calculateTime = (distanceMiles, speed) => {
    const timeHours = distanceMiles / speed;
    return formatTime(timeHours);
  };

  const handleDirectionsCallback = (response) => {
    if (response !== null && response.status === 'OK') {
      setDirectionsResponse(response);

      const route = response.routes[0];
      const distanceMeters = route.legs[0].distance.value;
      const distanceMiles = distanceMeters * 0.000621371;
      setRoadDistance(formatDistance(distanceMiles));

      setWalkingTime(calculateTime(distanceMiles, 3));
      setJoggingTime(`${calculateTime(distanceMiles, 6)} - ${calculateTime(distanceMiles, 4)}`);
      setBikingTime(calculateTime(distanceMiles, 12));
      setDrivingTime(calculateTime(distanceMiles, 40));

      setIsRouteShowing(true);
    } else {
      console.error('Error fetching directions:', response);
      setErrorMessage('Error fetching directions');
    }
  };

  const handleFindRoute = () => {
    if (originMarker && destinationMarker && originMarker.latLng && destinationMarker.latLng) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: originMarker.latLng,
          destination: destinationMarker.latLng,
          travelMode: google.maps.TravelMode[travelMode],
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            handleDirectionsCallback(result);
          } else {
            console.error('Error fetching directions', result);
            setErrorMessage('Error fetching directions');
          }
        }
      );
    } else {
      console.error('Origin and destination are required');
      setErrorMessage('Origin and destination are required');
    }
  };

  const handlePostRouteInMap = async () => {
    if (originMarker && destinationMarker) {
      try {
        const newPost = {
          origin: originMarker,
          destination: destinationMarker,
          travelMode: travelMode.toUpperCase(),
          roadDistance,
          walkingTime,
          joggingTime,
          bikingTime,
          drivingTime,
          description: eventDescription,
          username,
        };
  
        const response = await axios.post('http://localhost:5001/api/posts/createPost', newPost);
        if (response.status === 201) {
          setPostedRoutes((prevRoutes) => [response.data, ...prevRoutes]); // Add new post to the top of the list
          setShowCreateRouteModal(false);  // Close the modal
        } else {
          console.error('Error: Post was not created successfully.');
        }
      } catch (error) {
        console.error('Error posting route:', error);
      }
    } else {
      console.error('Error: Origin and destination are required for posting');
    }
  };
  
  const handleTravelModeChange = (mode) => {
    setTravelMode(mode);
    if (originMarker && destinationMarker) {
      handleFindRoute();
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      try {
        const response = await axios.get(`http://localhost:5001/users/search/${query}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery) {
      navigate(`/visit/${searchQuery}`);
      setSearchResults([]);
    }
  };

  const handleUserClick = (selectedUsername) => {
    setSearchQuery(selectedUsername);
    navigate(`/visit/${selectedUsername}`);
    setSearchResults([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleCreateRouteClick = () => {
    setShowCreateRouteModal(true);
  };

  const handleCloseCreateRouteModal = () => {
    setShowCreateRouteModal(false);
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  return (
    <>
      <Navbar expand="lg" fixed="top" className="shadow-sm navbar-custom" id="navbar-custom">
        <Container fluid>
          <Navbar.Brand onClick={() => navigate(`/dashboard/${username}`)} id="navbar-brand-custom">
            <Image src="/logo.png" alt="TAGALONG" id="navbar-logo-custom" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav-custom" id="navbar-toggle-custom" />
          <Navbar.Collapse id="basic-navbar-nav-custom">
            <Nav className="me-auto flex-grow-1" id="nav-custom">
              <div className="d-flex position-relative" id="search-bar-container-custom">
                <input
                  type="text"
                  placeholder="Search Buddies"
                  id="search-bar-custom"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button className="search-icon-button" onClick={handleSearchSubmit}>
                  <SearchIcon id="search-icon-custom" />
                </button>
                {searchResults.length > 0 && (
                  <ul id="suggestions-list-custom">
                    {searchResults.map((user) => (
                      <li key={user._id} onClick={() => handleUserClick(user.username)}>
                        <Image src={user.profilePicture} alt={user.username} className="suggested-profile-pic" />
                        {user.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="where-friends-meet" id="where-friends-meet">
                "Where Friends Meet"
              </div>
            </Nav>
            <Button
              variant="danger"
              id="create-route-button-custom"
              onClick={handleCreateRouteClick}
            >
              Create Route
            </Button>
            <Nav id="user-actions-custom" className="d-flex align-items-center">
              <Nav.Link onClick={() => navigate(`/dashboard/${username}`)} id="home-link-custom">
                <HomeIcon id="home-icon-custom" />
              </Nav.Link>
              <Nav.Link onClick={handleLogout} id="logout-link-custom">
                <ExitToAppIcon id="logout-icon-custom" />
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal for Creating Route */}
      <Modal
        show={showCreateRouteModal}
        onHide={handleCloseCreateRouteModal}
        centered
        size="lg"
        dialogClassName="custom-modal"
        backdropClassName="modal-backdrop-custom"
      >
        <Modal.Body style={{ padding: '0px', height: '65vh' }}>
          <div className="create-route-container">
            <div className="title-section">
              <h2>Create Route</h2>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="event-description-container">
              <input
                type="text"
                placeholder="Enter a description for your route (e.g., Date & Time)"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="event-description-input"
              />
            </div>

            <div className="inputs-map-section">
              <div className="autocomplete-container">
                <Autocomplete>
                  <input
                    id="origin-input-custom"
                    type="text"
                    placeholder="Enter origin A"
                    ref={originInputRef}
                    className={`autocomplete-input ${activeInput === 'origin' ? 'active' : ''}`}
                    onFocus={() => setActiveInput('origin')}
                  />
                </Autocomplete>
                <button onClick={handleClearOrigin} className="clear-button">Clear</button>
              </div>
              <div className="autocomplete-container">
                <Autocomplete>
                  <input
                    id="destination-input-custom"
                    type="text"
                    placeholder="Enter destination B"
                    ref={destinationInputRef}
                    className={`autocomplete-input ${activeInput === 'destination' ? 'active' : ''}`}
                    onFocus={() => setActiveInput('destination')}
                  />
                </Autocomplete>
                <button onClick={handleClearDestination} className="clear-button">Clear</button>
              </div>
            </div>

            <div className="travel-mode-and-distance">
              <div className="travel-mode-section">
                <button
                  onClick={() => handleTravelModeChange('WALKING')}
                  className={`travel-mode-button ${travelMode === 'WALKING' ? 'active' : ''}`}
                >
                  <DirectionsWalkIcon />
                </button>
                <button
                  onClick={() => handleTravelModeChange('BICYCLING')}
                  className={`travel-mode-button ${travelMode === 'BICYCLING' ? 'active' : ''}`}
                >
                  <DirectionsBikeIcon />
                </button>
                <button
                  onClick={() => handleTravelModeChange('DRIVING')}
                  className={`travel-mode-button ${travelMode === 'DRIVING' ? 'active' : ''}`}
                >
                  <DirectionsCarIcon />
                </button>
              </div>

              <div className="distance-display">
                Road Distance: {roadDistance}<br />
                {travelMode === 'WALKING' && (
                  <>
                    Average Walking Time: <span className="red-text">{walkingTime}</span><br />
                    Average Jogging Time: <span className="red-text">{joggingTime}</span>
                  </>
                )}
                {travelMode === 'BICYCLING' && (
                  <span>Average Biking Time: <span className="red-text">{bikingTime}</span></span>
                )}
                {travelMode === 'DRIVING' && (
                  <span>Average Driving Time: <span className="red-text">{drivingTime}</span></span>
                )}
              </div>
            </div>

            <div id="mapContainer" className="map-container" style={{ height: '40vh' }}>
              <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%' }}
                center={currentLocation || { lat: 27.994402, lng: -82.594849 }}
                zoom={10}
                onClick={handleMapClick}
                onRightClick={handleMapRightClick}
              >
                {originMarker && !isRouteShowing && <Marker position={originMarker.latLng} label="A" />}
                {destinationMarker && !isRouteShowing && <Marker position={destinationMarker.latLng} label="B" />}
                {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
              </GoogleMap>
            </div>

            <div className="buttons-section">
              <button onClick={handleFindRoute} className="route-button">Find Route</button>
              <button onClick={handlePostRouteInMap} className="route-button post-button">Post</button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NavbarCustom;
