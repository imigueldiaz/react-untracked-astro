/*
GEOLET version 20.12.31
Copyright (c) 2020 Ruben Holthuijsen; available under the MIT license
https://github.com/rhlt/leaflet-geolet/
*/

(function () {
	const _consolePrefix = '[GEOLET] ';
	const {L} = window;

	if (!L || !L.map) {
		// Was Leaflet loaded correctly?
		console.error(_consolePrefix + 'Missing Leaflet');
		return;
	}

	const _merge = function (object1, object2) {
		// Merge all properties from object 2 into object 1, recursively for plain objects

		if (typeof object2 !== 'object' || object2 === null) return object1;
		if (typeof object1 !== 'object' || object1 === null) object1 = {};

		for (const key in object2)
			if ({}.hasOwnProperty.call(object2, key)) {
				if (
					typeof object2[key] === 'object' &&
					object2[key] !== null &&
					Object.getPrototypeOf(object2[key]) ===
						Object.getPrototypeOf({})
				) {
					// Plain object: merge the next level
					object1[key] = _merge(object1[key], object2[key]);
				} else {
					// Anything else (including typed objects): just assign it
					object1[key] = object2[key];
				}
			}

		return object1;
	};

	const _defaultMarker = function () {
		// Generate a default marker
		return L.marker(null, {
			icon: L.divIcon({
				html: '<svg width="20" height="20" viewport="0 0 20 20"><circle cx="10" cy="10" r="10" style="fill:white"/><circle cx="10" cy="10" r="7" style="fill:none;stroke:currentColor;stroke-width:2px"/><circle cx="10" cy="10" r="4" style="fill:currentColor"/></svg>',
				iconAnchor: [10, 10],
				className: '',
			}),
			attribution:
				'<a href="https://github.com/rhlt/leaflet-geolet" target="_blank">Geolet</a>',
			zIndexOffset: 1000,
		});
	};

	L.geolet = L.Control.extend({
		options: {
			title: 'Find current location',
			className: null,
			activeClassName: null,
			style: {display: 'flex', color: ''},
			activeStyle: {display: 'flex', color: '#E00'},
			html: '<svg width="16" height="16" viewport="0 0 16 16" style="margin:auto auto"><circle cx="8" cy="8" r="7" style="fill:none;stroke:currentColor;stroke-width:2px"/><circle cx="8" cy="8" r="4" style="fill:currentColor"/></svg>',
			geoOptions: {
				enableHighAccuracy: true,
				maximumAge: 30000,
				timeout: 27000,
			},
			marker: null,
			popup: null,
			popupContent: null,
			updatePopupWhenOpen: true,
			autoPan: true,
			minZoom: 9,
		},

		_a: null,
		_map: null,
		_watchId: null,
		_latLng: null,
		_popupContent: null,
		_first: false,

		marker: null,
		popup: null,

		initialize(options) {
			// Set control options
			if (typeof options === 'object' && options !== null)
				L.setOptions(this, options);
		},

		isActive() {
			// Is the control active (are we displaying the current location, or trying to obtain it)?
			return Boolean(this._watchId);
		},

		getLatLng() {
			// Returns the coordinates of the location currently displayed on the map (if any) -- might still be null if isActive()
			return this.isActive() ? this._latLng : null;
		},

		updatePopup() {
			// Update the popup with new content
			let popupContent;
			if (!this._popup) return;
			if (
				typeof this.options.popupContent === 'undefined' ||
				this.options.popupContent === null
			) {
				popupContent =
					'<b>' + L.Geolet.formatLatLng(this.getLatLng()) + '</b>';
			} else if (typeof this.options.popupContent === 'function') {
				popupContent = this.options.popupContent.call(
					this,
					this.getLatLng(),
				);
			} else if (this.options.popupContent) {
				popupContent = this.options.popupContent;
			}

			if (popupContent !== null) this._popup.setContent(popupContent);
		},

		activate() {
			// Activate the current location display

			if (!L.Geolet.browserSupport) return;

			this.styleAnchor(true);

			const control = this;

			const geoSuccessCallback = function (data) {
				const first = Boolean(control._first);
				control._latLng = L.latLng(
					data.coords.latitude,
					data.coords.longitude,
					data.coords.altitude,
				);
				control._popupContent = control.options.popupContent;
				if (control._popup) {
					if (
						control._popup.isOpen() &&
						control.options.updatePopupWhenOpen
					)
						control.updatePopup();
				}

				if (control._marker) {
					control._marker.setLatLng(control._latLng);
					control._marker.addTo(control._map);
				}

				if (control._first) {
					control._first = false;
					if (control.options.autoPan)
						control._map.setView(
							control._latLng,
							control.options.minZoom
								? Math.max(
										control._map.getZoom(),
										control.options.minZoom,
								  )
								: control._map.getZoom(),
						);
				}

				control._map.fire('geolet_success', {
					control,
					first,
					marker: control._marker,
					latlng: control._latLng, // "latlng" all-lowercase for consistency with Leaflet's MouseEvent
					raw: data,
				});
			};

			const geoErrorCallback = function (data) {
				control.deactivate();
				console.warn(_consolePrefix + data.message);
				control._map.fire('geolet_error', {
					control,
					raw: data,
				});
			};

			this._first = true;
			this._watchId = navigator.geolocation.watchPosition(
				geoSuccessCallback,
				geoErrorCallback,
				this.options.geoOptions,
			);
		},

		deactivate() {
			// Deactivate current location display

			this.styleAnchor(false);

			if (this.isActive()) {
				navigator.geolocation.clearWatch(this._watchId);
				this._watchId = null;
			}

			this._latLng = null;

			if (this._marker) this._marker.remove();
			if (this._popup) this._popup.remove();
		},

		styleAnchor(active) {
			// Apply CSS classes and styles to the button's <a> element

			const className = [];
			if (!this._a) return;
			if (this.options.className) className.push(this.options.className);
			if (active && this.options.activeClassName)
				className.push(this.options.activeClassName);
			if (className.length) {
				this._a.className = className.join(' ');
			} else {
				this._a.className = '';
			}

			if (active && this.options.activeStyle)
				_merge(this._a.style, this.options.activeStyle);
			if (!active && this.options.style)
				_merge(this._a.style, this.options.style);
		},

		onAdd(map) {
			// Initialize everything when the control is added

			const control = this;
			const el = L.DomUtil.create('div');
			this._map = map;

			if (!L.Geolet.browserSupport) {
				console.warn(
					_consolePrefix + 'Browser does not support Geolocation',
				);
				el.style.display = 'none';
				return el;
			}

			if (this._marker) this._marker.remove();
			if (typeof this.options.marker === 'function') {
				this._marker = this.options.marker.call(this, map);
			} else if (this.options.marker) {
				this._marker = this.options.marker;
			} else if (
				typeof this.options.marker === 'undefined' ||
				this.options.marker === null
			) {
				this._marker = _defaultMarker();
			} else {
				this._marker = null;
			}

			if (this._popup) this._popup.remove();
			if (typeof this.options.popup === 'function') {
				this._popup = this.options.popup.call(this, map);
			} else if (this.options.popup) {
				this._popup = this.options.popup;
			} else if (
				typeof this.options.popup === 'undefined' ||
				this.options.popup === null
			) {
				this._popup = L.popup({autoPan: this.options.autoPan});
			} else {
				this._popup = null;
			}

			if (this._marker && this._popup) {
				this._marker.bindPopup(this._popup);
				this._marker.on('popupopen', () => {
					control.updatePopup();
				});
			}

			el.className = 'leaflet-bar leaflet-control';

			this._a = document.createElement('a');
			this._a.setAttribute('href', '#');
			if (this.options.title)
				this._a.setAttribute('title', this.options.title);

			this.styleAnchor();

			this._a.addEventListener('click', (event) => {
				if (control.isActive()) {
					// Currently inactive
					control.deactivate();
				} else {
					// Currently active
					control.activate();
				}

				event.preventDefault();
				event.stopPropagation();
			});

			this._a.addEventListener('dblclick', (event) => {
				// Ignore double clicks
				event.stopPropagation();
			});

			if (this.options.html) this._a.innerHTML = this.options.html;
			el.appendChild(this._a);

			return el;
		},

		onRemove() {
			// Deinitialize everything when the control is removed
			this.deactivate();
			this._a = null;
			this._map = null;
			this._popup = null;
			this._marker = null;
		},
	});

	// Browser support test
	L.Geolet.browserSupport = Boolean(
		navigator &&
			navigator.geolocation &&
			navigator.geolocation.watchPosition,
	);

	// Format coordinates (for use in the default pop up)
	L.Geolet.formatSymbols = {};
	L.Geolet.formatLatLng = function (latLng, l, a) {
		latLng = L.latLng(latLng, l, a);
		if (!latLng) return;

		const result = [];
		const symbols = _merge(
			{
				deg: '&deg;',
				min: '&#8217;',
				sec: '&#8221;',
				N: 'N',
				E: 'E',
				S: 'S',
				W: 'W',
				space: ' ',
				comma: ', ',
			},
			L.Geolet.formatSymbols,
		);

		['lat', 'lng'].forEach((key) => {
			const dir =
				key === 'lat'
					? latLng[key] < 0
						? symbols.S
						: symbols.N
					: latLng[key] < 0
					? symbols.W
					: symbols.E;
			const val = Math.round(Math.abs(latLng[key]) * 3600) / 3600;
			const deg = Math.floor(val) + symbols.deg;
			const min = (Math.floor(val * 60) % 60) + symbols.min;
			const sec = (Math.floor(val * 3600) % 60) + symbols.sec;
			result.push([deg, min, sec, dir].join(symbols.space));
		});

		return result.join(symbols.comma);
	};

	// Factory function
	L.geolet = function (options) {
		return new L.Geolet(options);
	};
})();
