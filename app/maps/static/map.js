var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var last_success_call_time = 0;

setInterval(
    function getPoint() {
        $.ajax({
            type: "GET",
            url: "http://localhost:8000/map/getPoints?LastSuccessCallTime=" + last_success_call_time,
            dataType: "json",
            success: parseSuccess,
            error: errorHandler
        });
    }, 1000);

function errorHandler(response, options, error) {
    console.error("Error while trying to retrieve beacon and drone data from server.");
    console.error(response);
    console.error(response.responseText);
    console.log(error);
}

function parseSuccess(response) {
    last_success_call_time = response.last_success_call_time;
    addBeaconPoints(response.beacons_positions);
    addDronePoints(response.drones_positions);
}

function addDronePoints(points) {
    for (var i = 0; i < points.length; i++) {
        var latitude = parseFloat(points[i].fields.latitude);
        var longitude = parseFloat(points[i].fields.longitude);
        addPoint(latitude, longitude);
    }
}

function addBeaconPoints(beacons) {
    for (var i = 0; i < beacons.length; i++) {
        var latitude = parseFloat(beacons[i]['latitude']);
        var longitude = parseFloat(beacons[i]['longitude']);
        addPoint(latitude, longitude);
    }
}

function addPoint(latitude, longitude) {
    new google.maps.Marker({
        position: {lat: latitude, lng: longitude},
        map: map,
        icon: {
            path: marker_icon_path,
            fillColor: 'red', fillOpacity: 1.0, strokeOpacity: 0.0, scale: 1
        },
        title: latitude + ", " + longitude
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