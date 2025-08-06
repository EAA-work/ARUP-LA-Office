 // Global variables
        let map, routingControl = null, routeMarkers = [];
        let officeMarker, officePolygon;
        let buildingsLayer, trafficSignalsLayer, linesLayer, pointsLayer;
        let dynamicLayers = {}; // Store categorized point layers
        
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

            // Initialize layers
            buildingsLayer = L.layerGroup();
            trafficSignalsLayer = L.layerGroup();
            linesLayer = L.layerGroup();
            pointsLayer = L.layerGroup();
            
            addOfficeElements();
            setupEventListeners();
            loadGeoJSONLayers();
        }

        function addOfficeElements() {
            officeMarker = L.marker([34.049948, -118.259959])
                .bindPopup('<b>ARUP LA Office</b><br>Main office location')
                .addTo(map);

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
            
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            
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
                case 'buildings':
                    populateBuildingsLayer();
                    map.addLayer(buildingsLayer);
                    break;
                case 'lines':
                    populateLinesLayer();
                    map.addLayer(linesLayer);
                    break;
                case 'points':
                    populatePointsLayer();
                    map.addLayer(pointsLayer);
                    break;
                case 'traffic-signals':
                    populatePointsLayer(); // This populates traffic signals layer
                    map.addLayer(trafficSignalsLayer);
                    break;
            }
        }

        function hideLayer(layer) {
            switch(layer) {
                case 'office':
                    map.removeLayer(officeMarker);
                    map.removeLayer(officePolygon);
                    break;
                case 'buildings':
                    map.removeLayer(buildingsLayer);
                    break;
                case 'lines':
                    map.removeLayer(linesLayer);
                    break;
                case 'points':
                    map.removeLayer(pointsLayer);
                    break;
                case 'traffic-signals':
                    map.removeLayer(trafficSignalsLayer);
                    break;
            }
        }

        // GeoJSON URLs
        const geojsonUrls = {
            buildings: "https://raw.githubusercontent.com/EAA-work/ARUP-LA-Office/main/geojson/map_buildings.geojson",
            lines: "https://raw.githubusercontent.com/EAA-work/ARUP-LA-Office/main/geojson/map_lines.geojson",
            points: "https://raw.githubusercontent.com/EAA-work/ARUP-LA-Office/main/geojson/map_points.geojson"
        };

        // Track loaded data to avoid re-fetching
        const loadedGeoJSON = {};

        function loadGeoJSONLayers() {
            // Don't auto-load any layers - they'll be loaded when toggled
            updateStatus('GeoJSON layers ready for toggle');
        }

        async function loadGeoJSONLayer(layerType) {
            if (loadedGeoJSON[layerType]) {
                return loadedGeoJSON[layerType];
            }

            try {
                updateStatus(`Loading ${layerType}...`);
                const response = await fetch(geojsonUrls[layerType]);
                const data = await response.json();
                loadedGeoJSON[layerType] = data;
                updateStatus(`${layerType} loaded`);
                return data;
            } catch (error) {
                updateStatus(`Error loading ${layerType}`);
                console.error(`Error loading ${layerType}:`, error);
                return null;
            }
        }

        async function populateBuildingsLayer() {
            const data = await loadGeoJSONLayer('buildings');
            if (!data) return;

            buildingsLayer.clearLayers();
            L.geoJSON(data, {
                style: { color: '#15a6e9c4', weight: 1, fillOpacity: 0.5, fillColor: '#4476ffff' },
                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};
                    let html = '<div><strong>🏗️ Building</strong><br>';
                    if (props.name) html += `<b>Name:</b> ${props.name}<br>`;
                    if (props.building) html += `<b>Type:</b> ${props.building}<br>`;
                    if (props.height) html += `<b>Height:</b> ${props.height}m<br>`;
                    if (props.amenity) html += `<b>Amenity:</b> ${props.amenity}<br>`;
                    html += '</div>';
                    layer.bindPopup(html);
                }
            }).addTo(buildingsLayer);
        }

        async function populateLinesLayer() {
            const data = await loadGeoJSONLayer('lines');
            if (!data) return;

            linesLayer.clearLayers();
            L.geoJSON(data, {
                style: { color: '#3388ff', weight: 2, opacity: 0.8 },
                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};
                    let html = '<div><strong>🛣️ Line Feature</strong><br>';
                    if (props.name) html += `<b>Name:</b> ${props.name}<br>`;
                    if (props.highway) html += `<b>Highway:</b> ${props.highway}<br>`;
                    if (props.type) html += `<b>Type:</b> ${props.type}<br>`;
                    html += '</div>';
                    layer.bindPopup(html);
                }
            }).addTo(linesLayer);
        }

        async function populatePointsLayer() {
            const data = await loadGeoJSONLayer('points');
            if (!data) return;

            pointsLayer.clearLayers();
            trafficSignalsLayer.clearLayers();
            
            // Clear existing dynamic layers
            Object.values(dynamicLayers).forEach(layer => layer.clearLayers());

            // Categories for grouping points
            const categories = {};
            const iconMap = {
                'restaurant': '🍽️',
                'cafe': '☕',
                'bar': '🍺',
                'pub': '🍻',
                'fast_food': '🍔',
                'bank': '🏦',
                'atm': '💰',
                'hospital': '🏥',
                'pharmacy': '💊',
                'school': '🎓',
                'university': '🎓',
                'hotel': '🏨',
                'fuel': '⛽',
                'supermarket': '🛒',
                'convenience': '🏪',
                'shop': '🛍️',
                'parking': '🅿️',
                'place_of_worship': '⛪',
                'theatre': '🎭',
                'cinema': '🎬',
                'museum': '🏛️',
                'library': '📚',
                'police': '👮',
                'fire_station': '🚒',
                'post_office': '📮'
            };

            data.features.forEach(feature => {
                const props = feature.properties || {};
                
                // Skip points without names (except traffic signals)
                if (!props.name && props.highway !== 'traffic_signals') {
                    return;
                }
                
                // Traffic signals
                if (props.highway === 'traffic_signals') {
                    L.geoJSON(feature, {
                        pointToLayer: (f, latlng) => L.circleMarker(latlng, { 
                            radius: 6, 
                            fillColor: '#ff5722', 
                            color: '#fff', 
                            weight: 2, 
                            fillOpacity: 0.8 
                        }),
                        onEachFeature: (f, layer) => {
                            layer.bindPopup('<div><strong>🚦 Traffic Signal</strong></div>');
                        }
                    }).addTo(trafficSignalsLayer);
                }
                // Categorize other points by amenity, shop, or highway type
                else if (props.name) {
                    const category = props.amenity || props.shop || props.highway || props.tourism || 'other';
                    
                    if (!categories[category]) {
                        categories[category] = [];
                    }
                    categories[category].push(feature);
                }
            });

            // Create dynamic layers for each category
            Object.keys(categories).forEach(category => {
                if (!dynamicLayers[category]) {
                    dynamicLayers[category] = L.layerGroup();
                }
                
                const icon = iconMap[category] || '📍';
                
                categories[category].forEach(feature => {
                    L.geoJSON(feature, {
                        pointToLayer: (f, latlng) => L.circleMarker(latlng, { 
                            radius: 6, 
                            fillColor: '#00cc99', 
                            color: '#006644', 
                            weight: 1, 
                            fillOpacity: 0.8 
                        }),
                        onEachFeature: (f, layer) => {
                            let html = `<div><strong>${icon} ${f.properties.name}</strong><br>`;
                            html += `<b>Category:</b> ${category}<br>`;
                            if (f.properties.amenity) html += `<b>Amenity:</b> ${f.properties.amenity}<br>`;
                            if (f.properties.shop) html += `<b>Shop:</b> ${f.properties.shop}<br>`;
                            if (f.properties.tourism) html += `<b>Tourism:</b> ${f.properties.tourism}<br>`;
                            html += '</div>';
                            layer.bindPopup(html);
                        }
                    }).addTo(dynamicLayers[category]);
                });
            });

            // Add dynamic toggles to the UI
            updateDynamicLayerToggles(categories);
        }

        function updateDynamicLayerToggles(categories) {
            const container = document.getElementById('dynamic-layers');
            const existingToggles = container.querySelectorAll('.toggle[data-dynamic]');
            existingToggles.forEach(toggle => toggle.remove());

            const iconMap = {
                'restaurant': '🍽️',
                'cafe': '☕',
                'bar': '🍺',
                'pub': '🍻',
                'fast_food': '🍔',
                'bank': '🏦',
                'atm': '💰',
                'hospital': '🏥',
                'pharmacy': '💊',
                'school': '🎓',
                'university': '🎓',
                'hotel': '🏨',
                'fuel': '⛽',
                'supermarket': '🛒',
                'convenience': '🏪',
                'shop': '🛍️',
                'parking': '🅿️',
                'place_of_worship': '⛪',
                'theatre': '🎭',
                'cinema': '🎬',
                'museum': '🏛️',
                'library': '📚',
                'police': '👮',
                'fire_station': '🚒',
                'post_office': '📮'
            };

            Object.keys(categories).forEach(category => {
                const icon = iconMap[category] || '📍';
                const count = categories[category].length;
                const categoryName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                const toggle = document.createElement('div');
                toggle.className = 'toggle';
                toggle.setAttribute('data-dynamic', category);
                toggle.innerHTML = `
                    <span>${icon} ${categoryName} (${count})</span>
                    <div class="switch"></div>
                `;
                
                toggle.onclick = () => {
                    const switchEl = toggle.querySelector('.switch');
                    const isOn = switchEl.classList.contains('on');
                    
                    if (isOn) {
                        switchEl.classList.remove('on');
                        map.removeLayer(dynamicLayers[category]);
                    } else {
                        switchEl.classList.add('on');
                        map.addLayer(dynamicLayers[category]);
                    }
                };
                
                container.appendChild(toggle);
            });
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

        function updateStatus(text) {
            document.getElementById('status').textContent = text;
            setTimeout(() => {
                document.getElementById('status').textContent = 'Ready';
            }, 3000);
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
                    createMarker: () => null,
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
