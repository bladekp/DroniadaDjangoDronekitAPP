var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var startTime = 0;
var DRONES = [];
var polylines = [];
var map;
var beacon_filter = [];

var cluster_styles =
    [
        [{
            url: 'http://localhost:8000/static/m1.png',
            width: 40,
            height: 40,
            textColor: '#ffffff',
            textSize: 11
        }],
        [{
            url: 'http://localhost:8000/static/m2.png',
            height: 40,
            width: 40,
            textColor: '#ffffff',
            textSize: 11
        }],
        [{
            url: 'http://localhost:8000/static/m3.png',
            height: 40,
            width: 40,
            textColor: '#525252',
            textSize: 11
        }],
        [{
            url: 'http://localhost:8000/static/m4.png',
            height: 40,
            width: 40,
            textColor: '#ffffff',
            textSize: 11
        }]
    ];

clearMarkers();

setInterval(
    function getPoint() {
        $.ajax({
            type: "GET",
            url: "http://localhost:8000/map/getData/?StartTime=" + startTime,
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
    createClusters();
}


function median(values) {
    values.sort(function (a, b) {
        return a - b;
    });
    var half = Math.floor(values.length / 2);
    if (values.length % 2)
        return values[half];
    else
        return (values[half - 1] + values[half]) / 2.0;
}

function createClusters() {
    markers.map(function (beacon_markers, i) {
        if (!beacon_filter[i]) {
            var cluster = new MarkerClusterer(
                map,
                beacon_markers,
                {
                    gridSize: 40,
                    averageCenter: true,
                    styles: cluster_styles[i === 0 ? 0 : i < 3 ? 1 : i < 6 ? 2 : 3]
                });
            cluster.setCalculator(function (markers, numStyles) {
                var rssiSum = 0;
                var min = 255;
                var max = 0;
                var rssiArr = [];
                for (var i = 0; i < markers.length; i++) {
                    var rssi = parseInt(markers[i].label.split(" ")[0]);
                    if (rssi > max) max = rssi;
                    if (rssi < min) min = rssi;
                    rssiArr.push(rssi);
                    rssiSum += rssi;
                }
                var med = median(rssiArr);
                var minor = markers[0].label.split(" ")[1];
                var major = markers[0].label.split(" ")[2];
                return {
                    text: minor + " " + major + " " + markers.length + "<br/>" + max + " " + min + "<br/>" + Math.round(rssiSum / markers.length) + " " + Math.round(med),
                    index: 0
                };
            });
        }
    });
}

function updateDrones(drones) {
    var found = false;
    for (var i = 0; i < drones.length; i++) {
        for (var j = 0; j < DRONES.length; j++) {
            if (DRONES[j].pk === drones[i].pk) {
                found = true;
            }
        }
        if (!found) {
            DRONES.push(drones[i]);
        }
        found = false;
    }
    updateLegend();
}

function findDrone(id) {
    for (var i = 0; i < DRONES.length; i++) {
        if (DRONES[i].pk === id) return DRONES[i];
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
        if (typeof lastPoint !== "undefined") {
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
        var scale = (100 - beacons[i].fields.altitude) / 30;
        var color = beacons[i].fields.major === 4 ? "red" :
            beacons[i].fields.major === 3 ? "yellow" :
                beacons[i].fields.major === 2 ? "green" :
                    beacons[i].fields.major === 1 ? "#696969" : "white";
        var label = beacons[i].fields.rssi + " " + beacons[i].fields.minor + " " + beacons[i].fields.major;
        var title = Math.round(altitude * 100) / 100 + " m";
        var marker = addPoint(latitude, longitude, color, label, title, 3.0);
        addMarkerToInternalCollection(marker, beacons[i].fields.major, beacons[i].fields.minor);
    }
}

function addMarkerToInternalCollection(marker, major, minor) {
    markers[indexInMarkersCollection(major,minor)].push(marker);
}

function indexInMarkersCollection(major, minor){
    switch (major) {
        case 1:
            return 0;
        case 2:
            return 0 + minor;
        case 3:
            return 2 + minor;
        case 4:
            return 5 + minor;
    }
}

function addPoint(latitude, longitude, color, label, title, scale) {
    return new google.maps.Marker({
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
}

function addPolyline(p1, p2, color) {
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

    var infoWindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0,0)
    });

    function popup(event) {
        var latitude = event.latLng.lat();
        var longitude = event.latLng.lng();
        var latLng = event.latLng;

        infoWindowHtml ='<div id="iw-text">' +
                            '<span id="lat" class="coord">' +
                                latitude +
                            '</span>' + ', ' +
                            '<span id="lng" class="coord">' +
                                longitude +
                            '</span>' +
                         '</div>';
        infoWindow.setContent(infoWindowHtml);
        infoWindow.setPosition(latLng) ;

        infoWindow.open(map);
        selectText('iw-text');
        document.execCommand('copy');
        clearSelection('iw-text');
        $('#lat').click( { elementId: 'lat'}, copyElementText );
        $('#lng').click( { elementId: 'lng'}, copyElementText );

    }
    //Add listener
    google.maps.event.addListener(map, "click", popup); //end addListener

    //Add listener
    google.maps.event.addListener(area, "click", popup); //end addListener

    var legend = document.getElementById('legend');
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);

    var beacons = document.getElementById('beacons');
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(beacons);

    for (var i = 0; i < 10; i++) {
        var div = document.createElement('div');
        var color = i === 0 ? "#525252" : i < 3 ? "#2bb128" : i < 6 ? "#fff600" : "#ff0612";
        var major = i === 0 ? 1 : i < 3 ? 2 : i < 6 ? 3 : 4;
        var minor = i === 9 ? 4 : ( i === 8 || i === 5 ) ? 3 : ( i === 2 || i === 4 || i === 7) ? 2 : 1;
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + major + "." + minor + '</span><input class="custom-checkbox" type="checkbox" checked="true" onchange="checkboxChanged(event,' + major + ',' + minor+ ');"/>';
        beacons.appendChild(div);
    }

    area.setMap(map);
}

function checkboxChanged(event, major, minor){
    if (event.target.checked) {
        check(major, minor);
    } else {
        uncheck(major, minor);
    }
}

function check(major, minor){
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = false;
    setMarkersMap(indx , map);
}

function uncheck(major, minor){
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = true;
    setMarkersMap(indx , null);
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
        setMarkersMap(i, null);
    }
    clearMarkers();
    for (var i = 0; i < polylines.length; i++) {
        polylines[i].setMap(null);
    }
    polylines = [];
    var date = $("#datetimepicker1").find("input").val();
    var parts = date.split(".");
    var tail = parts[2].split(" ");
    var hours = tail[1].split(":");
    var dateP = new Date(tail[0], parts[1] - 1, parts[0], hours[0], hours[1]);
    startTime = dateP.getTime();
}

function setMarkersMap(i, map){
    for (var j = 0; j < markers[i].length; j++) {
        markers[i][j].setMap(map);
    }
}

function clearMarkers() {
    markers = [];
    var beacons = document.getElementById('beacons');
    for (var i = 0; i < 10; i++) {
        markers[i] = [];
        beacon_filter[i] = false;
        if(beacons !== null) beacons.childNodes[i].childNodes[3].checked = true;
    }
}

function copyElementText(event){
    selectText(event.data.elementId);
    document.execCommand('copy');
    clearSelection(event.data.elementId);
}

function selectText(element) {
    var text = document.getElementById(element);
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
    selection.addRange(range);
}

function clearSelection(element) {
    var text = document.getElementById(element);
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
}

function updateLegend(){
    var legend = document.getElementById('legend');
    while (legend.firstChild) {
        legend.removeChild(legend.firstChild);
    }
    for(var i = 0; i < DRONES.length; i++){
        var div = document.createElement('div');
        var color = DRONES[i].fields.color;
        var name = DRONES[i].fields.name;
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + name + '</span>';
        legend.appendChild(div);
    }
}
