import React, {useState, useEffect} from 'react';
import {
	LayersControl,
	MapContainer,
	Marker,
	ScaleControl,
	TileLayer,
	Tooltip,
} from 'react-leaflet';
import L, {LatLng} from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './Map.css';

import RetinaMarkerIcon from 'leaflet/dist/images/marker-icon-2x.png';
import MarkerIcon from 'leaflet/dist/images/marker-icon.png';
import MarkerShadow from 'leaflet/dist/images/marker-shadow.png';

import OsmSearchControl from '../OsmSearchControl/OsmSearchControl';
import {type MapState} from '../../utils/Utils';

const Map = (): JSX.Element => {
	const [state, setState] = useState<MapState>({
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
			<ScaleControl></ScaleControl>
			<OsmSearchControl></OsmSearchControl>
			<LayersControl>
				<LayersControl.BaseLayer checked name='OpenStreetMaps'>
					<TileLayer
						zIndex={1}
						attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
						url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer checked name='ESRI World Imagery'>
					<TileLayer
						zIndex={2}
						attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
						url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
						minZoom={13}
						maxZoom={17}
					/>
				</LayersControl.BaseLayer>
				<LayersControl.Overlay checked name='Polución lumínica 2020'>
					<TileLayer
						zIndex={3}
						attribution='<a href="https://djlorenz.github.io/astronomy/lp2020/" target="_blank">Light Pollution Atlas Information</a>'
						url='https://djlorenz.github.io/astronomy/lp2020/overlay/tiles/tile_{z}_{x}_{y}.png'
						opacity={0.5}
						zoomOffset={-2}
						tileSize={1024}
						minZoom={13}
						maxNativeZoom={8}
						maxZoom={17}
					/>
				</LayersControl.Overlay>
			</LayersControl>

			<Marker position={position}>
				<Tooltip>Hola</Tooltip>
			</Marker>
		</MapContainer>
	);
};

export default Map;
