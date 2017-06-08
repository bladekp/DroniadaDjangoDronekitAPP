var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var last_success_call_time = 0;
var DRONES = [];

setInterval(
    function getPoint() {
        $.ajax({
            type: "GET",
            url: "http://localhost:8000/map/getData/?LastSuccessCallTime=" + last_success_call_time,
            dataType: "json",
            success: parseSuccess,
            error: errorHandler
        });
    }, 5000);

function errorHandler(response, options, error) {
    console.error("Error while trying to retrieve beacon and drone data from server.");
    console.error(response);
    console.error(response.responseText);
    console.log(error);
}

function parseSuccess(response) {
    last_success_call_time = response.last_success_call_time;
    updateDrones(response.drones);
    addBeaconPoints(response.beacons_positions);
    addDronesPolyline(response.drones_positions);
}

function updateDrones(drones){
    var found = false;
    for (var i = 0; i < drones.length; i++){
        for (var j = 0; j < DRONES.length; j++) {
            if (DRONES[j].pk === drones[i].pk) {
                found = true;
            }
        }
        if (!found){
            DRONES.push(drones[i]);
        }
        found = false;
    }
}

function findDrone(id){
    for (var i = 0; i < DRONES.length; i++){
        if( DRONES[i].pk === id) return DRONES[i];
    }
    console.error("Any drone with id " + id + " found.");
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
        if (typeof lastPoint !== "undefined"){
            addPolyline(lastPoint, drone.fields.last_position, drone.fields.color);
        }
        //addPoint(latitude, longitude, drone.fields.color); //actually we have polyline, we do not need additional point
    }
}

function addBeaconPoints(beacons) {
    for (var i = 0; i < beacons.length; i++) {
        var latitude = parseFloat(beacons[i]['latitude']);
        var longitude = parseFloat(beacons[i]['longitude']);
        addPoint(latitude, longitude);
    }
}

function addPoint(latitude, longitude, color) {
    new google.maps.Marker({
        position: {lat: latitude, lng: longitude},
        map: map,
        icon: {
            path: marker_icon_path,
            fillColor: color, fillOpacity: 1.0, strokeOpacity: 0.0, scale: 1
        },
        title: latitude + ", " + longitude
    });
}

function addPolyline(p1, p2, color){
    new google.maps.Polyline({
          path: [
              p1,
              p2
          ],
          map: map,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 2
    });
}

function initMap() {
    var center_pos = {lat: 50.089684, lng: 20.202649};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: center_pos,
        scrollwheel: true,
        draggable: true,
        mapTypeId: 'satellite',
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
        strokeColor: 'yellow',
        strokeOpacity: 1,
        strokeWeight: 5,
        fillColor: 'green',
        fillOpacity: 0.3
    });

    area.setMap(map);
}