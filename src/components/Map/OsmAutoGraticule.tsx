import AutoGraticule from 'leaflet-auto-graticule';
import {type AutoGraticuleOptions} from 'leaflet-auto-graticule';
import {useEffect} from 'react';
import {useMap} from 'react-leaflet';

const OsmAutoGraticule = (props?: AutoGraticuleOptions) => {
	const map = useMap();

	useEffect(() => {
		const grid = new AutoGraticule(props).addTo(map);
		return () => {
			map.removeLayer(grid);
		};
	}, [props, map]);
	return null;
};

export default OsmAutoGraticule;
