var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var startTime = 0;
var DRONES = [];
var markers = [];
var polylines = [];

setInterval(
    function getPoint() {
        $.ajax({
            type: "GET",
            url: "http://remote.jgwservices.com:8000/map/getData/?StartTime=" + startTime,
            dataType: "json",
            success: parseSuccess,
            error: errorHandler
        });
    }, 500);

function errorHandler(response, options, error) {
    console.error("Error while trying to retrieve beacon and drone data from server.");
    console.error(response);
    console.error(response.responseText);
    console.log(error);
}

function parseSuccess(response) {
    startTime = response.current_time;
    updateDrones(response.drones);
    addDronesPolyline(response.drones_positions);
    addBeaconPoints(response.beacons_positions);
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
        } else {
            addPoint(latitude, longitude, drone.fields.color, "", drone.fields.name, 1); //add point if just one point (start point)
        }
    }
}

function addBeaconPoints(beacons) {
    for (var i = 0; i < beacons.length; i++) {
        var latitude = beacons[i].fields.latitude;
        var longitude = beacons[i].fields.longitude;
        var altitude = beacons[i].fields.altitude;
        var scale = (100-beacons[i].fields.altitude)/30;
        var color = beacons[i].fields.major === 4 ? "red" :
                    beacons[i].fields.major === 3 ? "yellow" :
                    beacons[i].fields.major === 2 ? "green" :
                    beacons[i].fields.major === 1 ? "#696969" : "white";
        var label = beacons[i].fields.rssi + " " + beacons[i].fields.minor;
        if (beacons[i].fields.major > 4 || beacons[i].fields.major < 1){
            label += " "+ beacons[i].fields.major;
        }
        var title = Math.round(altitude*100)/100 + " m";
        addPoint(latitude, longitude, color, label, title , 3.0 );
    }
}

function addPoint(latitude, longitude, color, label, title, scale) {
    var marker = new google.maps.Marker({
        position: {lat: latitude, lng: longitude},
        map: map,
        icon: {
            path: marker_icon_path,
            fillColor: color,
            fillOpacity: 1.0,
            strokeOpacity: 0.0,
            scale: scale
        },
        label: label,
        title: title
    });
    markers.push(marker);
}

function addPolyline(p1, p2, color){
    var polyline = new google.maps.Polyline({
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
    polylines.push(polyline);
}

function initMap() {
    var center_pos = {lat: 50.089684, lng: 20.202649};
    map = new google.maps.Map(document.getElementById('map'), {
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

    area.setMap(map);
}

$(function () {
    var d = new Date();
    var month = d.getMonth();
    var day = d.getDate();
    var year = d.getFullYear();
    var hour = d.getHours();
    var minute = d.getMinutes();

    $('#datetimepicker1')
        .datetimepicker({
            locale: 'pl',
            defaultDate: new Date()
        });

    startTime = d.getTime();
});


function buttonEvent() {
    for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
    }
    for (var i = 0; i < polylines.length; i++) {
          polylines[i].setMap(null);
    }
    markers = [];
    polylines = [];
    var date = $("#datetimepicker1").find("input").val();
    var parts = date.split(".");
    var tail = parts[2].split(" ");
    var hours = tail[1].split(":");
    var dateP = new Date(tail[0], parts[1] - 1, parts[0], hours[0], hours[1]);
    startTime = dateP.getTime();
}

