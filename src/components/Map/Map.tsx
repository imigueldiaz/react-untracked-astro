import React, {useState, useEffect} from 'react';
import {MapContainer, Marker, TileLayer, Tooltip} from 'react-leaflet';
import L, {LatLng} from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './Map.css';
import './geosearch.css';

import RetinaMarkerIcon from 'leaflet/dist/images/marker-icon-2x.png';
import MarkerIcon from 'leaflet/dist/images/marker-icon.png';
import MarkerShadow from 'leaflet/dist/images/marker-shadow.png';

import OsmSearchControl from './OsmSearchControl';

type State = {
	lat: number;
	lng: number;
	zoom: number;
	isLoading: boolean;
};

const Map = (): JSX.Element => {
	const [state, setState] = useState<State>({
		lat: 0,
		lng: 0,
		zoom: 15,
		isLoading: true,
	});

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setState({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					isLoading: false,
					zoom: state.zoom,
				});
			},
			() => {
				setState({
					lat: 41.074749,
					lng: -3.457954,
					isLoading: false,
					zoom: state.zoom,
				});
			},
		);
	}, [state]);

	// This is necesary on react-leaflet by now
	const fixMapIcon = () => {
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: RetinaMarkerIcon,
			iconUrl: MarkerIcon,
			shadowUrl: MarkerShadow,
		});
	};

	fixMapIcon();

	const position = new LatLng(state.lat, state.lng);

	if (state.isLoading) {
		return <div>Cargando</div>;
	}

	return (
		<MapContainer
			center={position}
			zoom={state.zoom}
			minZoom={13}
			maxZoom={17}
		>
			<OsmSearchControl></OsmSearchControl>
			<TileLayer
				attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>
			<Marker position={position}>
				<Tooltip>Estamos aquí</Tooltip>
			</Marker>
		</MapContainer>
	);
};

export default Map;
