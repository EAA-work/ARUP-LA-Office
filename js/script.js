 // Global variables
        let map, routingControl = null, routeMarkers = [];
        let osmLayer, restaurantLayer, parkingLayer, officeMarker, officePolygon;
        
        // Base layers
        const baseLayers = {
            osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }),
            hot: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }),
            topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap'
            })
        };

        // Initialize map
        function init() {
            map = L.map('map', {
                center: [34.049948, -118.259959],
                zoom: 18,
                layers: [baseLayers.osm]
            });

            osmLayer = L.layerGroup();
            restaurantLayer = L.layerGroup();
            parkingLayer = L.layerGroup();
            
            addOfficeElements();
            setupEventListeners();
        }

        function addOfficeElements() {
            // Office marker
            officeMarker = L.marker([34.049948, -118.259959])
                .bindPopup('<b>ARUP LA Office</b><br>Main office location')
                .addTo(map);

            // Rally point polygon
            officePolygon = L.polygon([
                [34.05100238, -118.25680015],
                [34.05105097, -118.25675616], 
                [34.05101453, -118.25670711],
                [34.05097342, -118.25674658]
            ], {color: 'red', fillColor: '#f03', fillOpacity: 0.5})
            .bindPopup("ARUP LA Office Rally Point")
            .addTo(map);
        }

        function setupEventListeners() {
            // Panel toggles
            document.getElementById('layers-btn').onclick = () => togglePanel('layers-panel', 'layers-btn');
            document.getElementById('routing-btn').onclick = () => togglePanel('routing-panel', 'routing-btn');
            document.getElementById('osm-btn').onclick = () => document.getElementById('osm-file').click();

            // Base map changes
            document.querySelectorAll('input[name="baseMap"]').forEach(radio => {
                radio.onchange = (e) => {
                    Object.values(baseLayers).forEach(layer => map.removeLayer(layer));
                    baseLayers[e.target.value].addTo(map);
                };
            });

            // Layer toggles
            document.querySelectorAll('.toggle').forEach(toggle => {
                toggle.onclick = () => {
                    const layer = toggle.dataset.layer;
                    const switchEl = toggle.querySelector('.switch');
                    const isOn = switchEl.classList.contains('on');
                    
                    if (isOn) {
                        switchEl.classList.remove('on');
                        hideLayer(layer);
                    } else {
                        switchEl.classList.add('on');
                        showLayer(layer);
                    }
                };
            });

            // Floating buttons
            document.getElementById('location-btn').onclick = getCurrentLocation;
            document.getElementById('office-btn').onclick = () => map.setView([34.049948, -118.259959], 18);

            // OSM file upload
            document.getElementById('osm-file').onchange = handleOSMFile;

            // Close panels on outside click
            document.onclick = (e) => {
                if (!e.target.closest('.panel') && !e.target.closest('.btn')) {
                    document.querySelectorAll('.panel').forEach(p => p.classList.remove('show'));
                    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                }
            };
        }

        function togglePanel(panelId, btnId) {
            const panel = document.getElementById(panelId);
            const btn = document.getElementById(btnId);
            
            // Close all panels first
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            
            // Toggle current panel
            if (!panel.classList.contains('show')) {
                panel.classList.add('show');
                btn.classList.add('active');
            }
        }

        function showLayer(layer) {
            switch(layer) {
                case 'office':
                    map.addLayer(officeMarker);
                    map.addLayer(officePolygon);
                    break;
                case 'osm':
                    map.addLayer(osmLayer);
                    break;
                case 'parking':
                    loadParkingGarages();
                    map.addLayer(parkingLayer);
                    break;
                case 'restaurants':
                    loadRestaurants();
                    map.addLayer(restaurantLayer);
                    break;
            }
        }

        function hideLayer(layer) {
            switch(layer) {
                case 'office':
                    map.removeLayer(officeMarker);
                    map.removeLayer(officePolygon);
                    break;
                case 'osm':
                    map.removeLayer(osmLayer);
                    break;
                case 'parking':
                    map.removeLayer(parkingLayer);
                    break;
                case 'restaurants':
                    map.removeLayer(restaurantLayer);
                    break;
            }
        }

        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const loc = [pos.coords.latitude, pos.coords.longitude];
                    L.marker(loc).addTo(map).bindPopup('Your Location');
                    map.setView(loc, 16);
                });
            }
        }

        function loadRestaurants() {
            restaurantLayer.clearLayers();
            
            // Sample restaurants near office with custom icons
            const restaurants = [
                {pos: [34.0505, -118.2585], name: "Downtown Deli", type: "Deli", hours: "7AM-7PM"},
                {pos: [34.0515, -118.2595], name: "Coffee Corner", type: "Cafe", hours: "6AM-9PM"},
                {pos: [34.0495, -118.2575], name: "Pizza Place", type: "Restaurant", hours: "11AM-11PM"},
                {pos: [34.0485, -118.2605], name: "Sushi Bar", type: "Restaurant", hours: "5PM-12AM"}
            ];
            
            restaurants.forEach(r => {
                const icon = L.divIcon({
                    html: '🍽️',
                    className: 'custom-icon',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12]
                });
                
                L.marker(r.pos, { icon })
                    .bindPopup(`
                        <div style="text-align: center;">
                            <h4>${r.name}</h4>
                            <p><strong>Type:</strong> ${r.type}</p>
                            <p><strong>Hours:</strong> ${r.hours}</p>
                            <p style="color: #666; font-size: 12px;">Click for more details</p>
                        </div>
                    `)
                    .addTo(restaurantLayer);
            });
        }

        function loadParkingGarages() {
            parkingLayer.clearLayers();
            
            // Sample parking garages near office
            const parkingGarages = [
                {pos: [34.0520, -118.2580], name: "Central Parking Garage", spaces: "450 spaces", rate: "$15/day"},
                {pos: [34.0510, -118.2610], name: "Metro Parking Structure", spaces: "320 spaces", rate: "$12/day"},
                {pos: [34.0480, -118.2570], name: "Downtown Parking Plaza", spaces: "280 spaces", rate: "$18/day"},
                {pos: [34.0530, -118.2600], name: "Business District Garage", spaces: "380 spaces", rate: "$20/day"}
            ];
            
            parkingGarages.forEach(p => {
                const icon = L.divIcon({
                    html: '🅿️',
                    className: 'custom-icon',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12]
                });
                
                L.marker(p.pos, { icon })
                    .bindPopup(`
                        <div style="text-align: center;">
                            <h4>${p.name}</h4>
                            <p><strong>Capacity:</strong> ${p.spaces}</p>
                            <p><strong>Rate:</strong> ${p.rate}</p>
                            <p style="color: #666; font-size: 12px;">Available 24/7</p>
                        </div>
                    `)
                    .addTo(parkingLayer);
            });
        }

        function handleOSMFile(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            updateStatus('Loading OSM data...', 'loading');
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    parseOSMData(event.target.result);
                    updateStatus('OSM data loaded', 'loaded');
                } catch (error) {
                    updateStatus('Error loading OSM data', 'error');
                }
            };
            reader.readAsText(file);
        }

        function parseOSMData(osmXml) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(osmXml, 'text/xml');
            
            osmLayer.clearLayers();
            parkingLayer.clearLayers();
            
            const nodes = xmlDoc.getElementsByTagName('node');
            let placeCount = 0;
            let parkingCount = 0;
            
            for (let node of nodes) {
                const lat = parseFloat(node.getAttribute('lat'));
                const lon = parseFloat(node.getAttribute('lon'));
                const tags = {};
                
                node.querySelectorAll('tag').forEach(tag => {
                    tags[tag.getAttribute('k')] = tag.getAttribute('v');
                });
                
                // Handle parking garages
                if (tags.amenity === 'parking' || tags.parking) {
                    const icon = L.divIcon({
                        html: '🅿️',
                        className: 'custom-icon',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12]
                    });
                    
                    const name = tags.name || 'Parking Area';
                    const capacity = tags.capacity ? `${tags.capacity} spaces` : 'Capacity unknown';
                    const fee = tags.fee === 'yes' ? 'Paid parking' : tags.fee === 'no' ? 'Free parking' : 'Fee unknown';
                    
                    L.marker([lat, lon], { icon })
                        .bindPopup(`
                            <div style="text-align: center;">
                                <h4>${name}</h4>
                                <p><strong>Capacity:</strong> ${capacity}</p>
                                <p><strong>Fee:</strong> ${fee}</p>
                                <p style="color: #666; font-size: 12px;">From OSM data</p>
                            </div>
                        `)
                        .addTo(parkingLayer);
                    parkingCount++;
                }
                
                // Handle other places of interest
                else if (tags.name && (tags.amenity || tags.shop || tags.tourism)) {
                    let icon = '📍';
                    
                    // Choose appropriate icon based on amenity
                    switch (tags.amenity || tags.shop || tags.tourism) {
                        case 'restaurant':
                        case 'cafe':
                        case 'bar':
                        case 'pub':
                        case 'fast_food':
                            icon = '🍽️';
                            break;
                        case 'bank':
                        case 'atm':
                            icon = '🏦';
                            break;
                        case 'hospital':
                        case 'pharmacy':
                            icon = '🏥';
                            break;
                        case 'school':
                        case 'university':
                            icon = '🎓';
                            break;
                        case 'hotel':
                            icon = '🏨';
                            break;
                        case 'fuel':
                            icon = '⛽';
                            break;
                        case 'supermarket':
                        case 'convenience':
                            icon = '🛒';
                            break;
                        default:
                            icon = '📍';
                    }
                    
                    const customIcon = L.divIcon({
                        html: icon,
                        className: 'custom-icon',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12]
                    });
                    
                    const amenityType = tags.amenity || tags.shop || tags.tourism || 'Place';
                    const address = tags['addr:street'] ? 
                        `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : 
                        'Address not available';
                    
                    L.marker([lat, lon], { icon: customIcon })
                        .bindPopup(`
                            <div style="text-align: center;">
                                <h4>${tags.name}</h4>
                                <p><strong>Type:</strong> ${amenityType}</p>
                                <p><strong>Address:</strong> ${address}</p>
                                <p style="color: #666; font-size: 12px;">From OSM data</p>
                            </div>
                        `)
                        .addTo(osmLayer);
                    placeCount++;
                }
            }
            
            updateStatus(`OSM: ${placeCount} places, ${parkingCount} parking areas loaded`, 'loaded');
        }

        function updateStatus(text, type = '') {
            const status = document.getElementById('status');
            status.textContent = text;
            status.className = `status ${type}`;
        }

        // Geocoding function
        async function geocode(address) {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.length > 0 ? {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                name: data[0].display_name
            } : null;
        }

        // Routing functions
        async function getRoute() {
            const startAddr = document.getElementById('start').value;
            const endAddr = document.getElementById('end').value;
            const routeInfo = document.getElementById('route-info');
            
            if (!startAddr || !endAddr) {
                alert('Please enter both start and end locations');
                return;
            }
            
            routeInfo.innerHTML = 'Calculating route...';
            routeInfo.classList.add('show');
            
            const start = await geocode(startAddr);
            const end = await geocode(endAddr);
            
            if (start && end) {
                clearRoute();
                
                const startMarker = L.marker([start.lat, start.lon])
                    .bindPopup(`<b>Start:</b> ${start.name}`)
                    .addTo(map);
                const endMarker = L.marker([end.lat, end.lon])
                    .bindPopup(`<b>End:</b> ${end.name}`)
                    .addTo(map);
                
                routeMarkers.push(startMarker, endMarker);
                
                routingControl = L.Routing.control({
                    waypoints: [L.latLng(start.lat, start.lon), L.latLng(end.lat, end.lon)],
                    routeWhileDragging: true,
                    createMarker: () => null, // Don't create additional markers
                    addWaypoints: false
                }).on('routesfound', function(e) {
                    const route = e.routes[0];
                    const distance = (route.summary.totalDistance / 1000).toFixed(2);
                    const time = Math.round(route.summary.totalTime / 60);
                    
                    routeInfo.innerHTML = `
                        <strong>Route Found:</strong><br>
                        📏 Distance: ${distance} km<br>
                        ⏱️ Time: ${time} minutes<br>
                        🚗 Via: ${route.name || 'Best route'}
                    `;
                }).addTo(map);
            } else {
                routeInfo.innerHTML = 'Route calculation failed. Please check your addresses.';
            }
        }

        function clearRoute() {
            const routeInfo = document.getElementById('route-info');
            
            if (routingControl) {
                map.removeControl(routingControl);
                routingControl = null;
            }
            routeMarkers.forEach(marker => map.removeLayer(marker));
            routeMarkers = [];
            
            routeInfo.classList.remove('show');
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);