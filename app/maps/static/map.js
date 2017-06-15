var WARSZTAT_POSITION = {lat: 50.09085137159468, lng: 20.200510025024414}; // {lat: 50.09085137159468, lng: 20.200510025024414}=WARSZTAT {lat: 51.84122169789504, lng: 20.34555584192276};=BABSK
var BEACONS_COUNT = 10;
var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var DRONES = [];
var MARKERS = [];
var estimations = [];
var MAP;
var beacon_filter = [];
var MAX_NUMBER_OF_OCCURENCES = 20; //how many occurrences use to estimate position
clearMarkers();

function updateDrones(drones) {
    var found = false;
    for (var i = 0; i < drones.length; i++) {
        for (var j = 0; j < DRONES.length; j++) {
            if (DRONES[j].pk === drones[i].pk) {
                found = true;
            }
        }
        if (!found) {
            drones[i].polylines = [];
            DRONES.push(drones[i]);
            updateLegend(DRONES);
        }
        found = false;
    }
}

function addDronesPolyline(points) {
    for (var i = 0; i < points.length; i++) {
        var latitude = parseFloat(points[i].fields.latitude);
        var longitude = parseFloat(points[i].fields.longitude);
        var drone = findDrone(points[i].fields.drone);
        var lastPoint = drone.fields.last_position;
        drone.fields.last_position = {
            lat: latitude,
            lng: longitude
        };
        if (typeof lastPoint !== "undefined") {
            drone.polylines.push(addPolyline(lastPoint, drone.fields.last_position, drone.fields.color));
        }
    }
}

function addBeaconPoints(beacons) {
    var beacon_measurements_modified = false;

    for (var i = 0; i < beacons.length; i++) {
        var latitude = beacons[i].fields.latitude;
        var longitude = beacons[i].fields.longitude;
        var altitude = beacons[i].fields.altitude;
        var major = beacons[i].fields.major;
        var minor = beacons[i].fields.minor;
        var rssi = beacons[i].fields.rssi;
        var color = getColor(major);
        var label = beacons[i].fields.rssi + " " + beacons[i].fields.minor;
        var title = Math.round(altitude * 100) / 100 + " m";

        //check how many better results already exists
        var betterOccurencesCount = betterResultsCount(major, minor, rssi);

        //add new better result
        if (betterOccurencesCount < MAX_NUMBER_OF_OCCURENCES) {
            beacon_measurements_modified = true;
            addResult(major, minor, latitude, longitude, color, label, title, rssi, altitude);
            var beaconIndex = indexInMarkersCollection(major, minor);

            //delete result if there is already too many of them
            if (MARKERS[beaconIndex].measurements.length >= MAX_NUMBER_OF_OCCURENCES) deleteResult(beaconIndex, rssiMax(beaconIndex))
        }
    }

    if (beacon_measurements_modified) estimateBeaconPosition();
}

function addResult(major, minor, latitude, longitude, color, label, title, rssi, altitude) {
    var marker = addPoint(latitude, longitude, color, label, title, 3.0);
    var circle = addPointCircle(latitude, longitude, getApproxDistance(rssi), color);
    var beacon = addFoundBeacon(latitude, longitude, major, minor, rssi, altitude);
    addMarkerToInternalCollection(marker, circle, beacon, major, minor);
}

function addMarkerToInternalCollection(marker, circle, beacon, major, minor) {
    MARKERS[indexInMarkersCollection(major, minor)].measurements.push({marker: marker, circle: circle, beacon: beacon});
}

function addPoint(latitude, longitude, color, label, title, scale) {
    return new google.maps.Marker({
        position: {lat: latitude, lng: longitude},
        map: MAP,
        icon: {
            path: marker_icon_path,
            fillColor: color,
            fillOpacity: 1.0,
            strokeOpacity: 0.0,
            scale: scale
        },
        label: label,
        title: title,
        clickable: false
    });
}

//this function add circle around acceptable result
function addPointCircle(latitude, longitude, radius, color) {
    return new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: '#FFFFF',
        fillOpacity: 0.0,
        map: MAP,
        center: {lat: latitude, lng: longitude},
        radius: radius,
        clickable: false
    });
}

//this function adds new beacon to container of acceptable results
function addFoundBeacon(latitude, longitude, major, minor, rssi, altitude) {
    return {
        position: {lat: latitude, lng: longitude},
        colors: {major: major, minor: minor},
        rssi: rssi,
        altitude: altitude
    };
}

function addPolyline(p1, p2, color) {
    return new google.maps.Polyline({
        path: [
            p1,
            p2
        ],
        map: MAP,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
}

function initMap() {
    var center_pos = WARSZTAT_POSITION;
    MAP = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: center_pos,
        scrollwheel: true,
        draggable: true,
        mapTypeId: 'satellite'
    });


    /* north-west corner, clockwise direction */
    var areaCoords = [
        {lat: 50.0931667, lng: 20.1916000},
        {lat: 50.0931667, lng: 20.2000000},
        {lat: 50.0931667, lng: 20.2066167},
        {lat: 50.0903500, lng: 20.2090667},
        {lat: 50.0883333, lng: 20.2090667},
        {lat: 50.0883333, lng: 20.2029000},
        {lat: 50.0883333, lng: 20.2000000},
        {lat: 50.0883333, lng: 20.1970000},
        {lat: 50.0883333, lng: 20.1926833},
        {lat: 50.0906167, lng: 20.1919500},
        {lat: 50.0916333, lng: 20.1916000}
    ];

    var area = new google.maps.Polygon({
        paths: areaCoords,
        strokeColor: '#FFA500',
        strokeOpacity: 1,
        strokeWeight: 5,
        fillColor: 'green',
        fillOpacity: 0.2
    });

    google.maps.event.addListener(MAP, "click", popup);
    google.maps.event.addListener(area, "click", popup);

    var legend = document.getElementById('legend');
    MAP.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);

    var beacons = document.getElementById('beacons');
    MAP.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(beacons);

    for (var i = 0; i < BEACONS_COUNT; i++) {
        var div = document.createElement('div');
        var color = i === 0 ? "#525252" : i < 3 ? "#2bb128" : i < 6 ? "#fff600" : "#ff0612";
        var major = i === 0 ? 1 : i < 3 ? 2 : i < 6 ? 3 : 4;
        var minor = i === 9 ? 4 : ( i === 8 || i === 5 ) ? 3 : ( i === 2 || i === 4 || i === 7) ? 2 : 1;
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + major + "." + minor + '</span><input class="custom-checkbox" type="checkbox" checked="true" onchange="checkboxChanged(event,' + major + ',' + minor + ');"/>';
        beacons.appendChild(div);
    }

    area.setMap(MAP);
}

function setMarkersMap(beaconIndex, map) {
    for (var j = 0; j < MARKERS[beaconIndex].measurements.length; j++) {
        setMarkerMap(beaconIndex, j, map);
    }
}

function setMarkerMap(beaconIndex, measureIndex, map) {
    MARKERS[beaconIndex].measurements[measureIndex].marker.setMap(map);
    MARKERS[beaconIndex].measurements[measureIndex].marker.visible = (map !== null);
}

function setCirclesMap(beaconIndex, map) {
    for (var j = 0; j < MARKERS[beaconIndex].measurements.length; j++) {
        setCircleMap(beaconIndex, j, map);
    }
}

function setCircleMap(beaconIndex, measureIndex, map) {
    MARKERS[beaconIndex].measurements[measureIndex].circle.setMap(map);
}

function clearMarkers() {
    var beacons = document.getElementById('beacons');
    for (var i = 0; i < BEACONS_COUNT; i++) {
        MARKERS[i] = {estimation: { possiblePositions : [], possiblePositionsMarkers : [], marker : null, result : null}, measurements: []};
        beacon_filter[i] = false;
        if (beacons !== null) beacons.childNodes[i].childNodes[3].checked = true;
    }
}
