import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
import {GeoSearchControl, OpenStreetMapProvider} from 'leaflet-geosearch';
import './geosearch.css';

const OsmSearchControl = () => {
	const map = useMap();

	useEffect(() => {
		// eslint-disable-next-line new-cap
		const searchControl = GeoSearchControl({
			provider: new OpenStreetMapProvider(),
			map,
		});

		map.addControl(searchControl);
		return () => {
			map.removeControl(searchControl);
		};
	}, [map]);
	return null;
};

export default OsmSearchControl;
