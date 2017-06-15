var m_rad = 5;
var marker_icon_path = 'M 0, 0 m -' + m_rad + ', 0 a ' + m_rad + ',' + m_rad + ' 0 1,0 ' + 2 * m_rad + ',0 a ' + m_rad + ',' + m_rad + ' 0 1,0 -' + 2 * m_rad + ',0';
var startTime = 0;
var DRONES = [];
var markers = [];
var estimations = [];
var polylines = [];
var map;
var beacon_filter = [];
var possiblePositions = [];
clearMarkers();


var NUMBEROFOCCURENCES = 20; //how many occurrences use to estimate position

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
    // addDronesPolyline(response.drones_positions);
    addBeaconPoints(response.beacons_positions);
    // estimatePosistion();
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
        var major = beacons[i].fields.major;
        var minor = beacons[i].fields.minor;
        var rssi = beacons[i].fields.rssi;
        var time = beacons[i].fields.time;
        var color = major === 4 ? "red" :
            major === 3 ? "yellow" :
                major === 2 ? "green" :
                    major === 1 ? "#696969" : "white";

        var label = beacons[i].fields.rssi + " " + beacons[i].fields.minor;


        var title = Math.round(altitude * 100) / 100 + " m";

        //check how many better results already exists
        var occs = resultsCount(major, minor, rssi);


        //delete result if there is already too many of them
        if (occs.occFound >= NUMBEROFOCCURENCES) {
            var indexToDelete = rssiMax(major, minor);
            deleteResult(indexInMarkersCollection(major, minor), indexToDelete)
        }

        //add new better result
        if (occs.betterOcc < NUMBEROFOCCURENCES) {
            addResult(major, minor, latitude, longitude, color, label, title, rssi, altitude);
        }


    }
}

function deleteResult(i, j) {
    setMarkerMap(i, j, null);
    setCircleMap(i, j, null);
    markers[i].splice(j, 1);
}

function addResult(major, minor, latitude, longitude, color, label, title, rssi, altitude) {
    var marker = addPoint(latitude, longitude, color, label, title, 3.0);
    var circle = addPointCircle(latitude, longitude, getApproxDistance(rssi), color);
    var beacon = addFoundBeacon(latitude, longitude, major, minor, rssi, altitude);
    addMarkerToInternalCollection(marker, circle, beacon, major, minor);
}

function estimatePosistion() {
    var i;
    var j;
    var k;

    for (i = 0; i < markers.length; i++) {
        for (j = 0; j < markers[i].length; j++) {
            for (k = j + 1; k < markers[i].length; k++) {
                var m1 = markers[i][j];
                var m2 = markers[i][k];

                var c1 = new google.maps.LatLng(m1.beacon.position);
                var c2 = new google.maps.LatLng(m2.beacon.position);

                var d = google.maps.geometry.spherical.computeDistanceBetween(c1, c2);

                var r1 = getApproxDistance(m1.beacon.rssi);
                var r2 = getApproxDistance(m2.beacon.rssi);


                if (!((d > (r1 + r2)) || (d < Math.abs(r1 - r2)))) {

                    var p1 = google.maps.geometry.spherical.computeOffset(c1, r1, 0);
                    var p2 = google.maps.geometry.spherical.computeOffset(c2, r2, 0);
                    var mid = new google.maps.LatLng({lat: (c1.lat() + c2.lat()) / 2, lng: (c1.lng() + c2.lng()) / 2});

                    var cx1 = c1.lng() - mid.lng();
                    var cx2 = c2.lng() - mid.lng();


                    var cy1 = Math.log(Math.tan(c1.lat()) + (1 / Math.cos(c1.lat())));
                    var cy2 = Math.log(Math.tan(c2.lat()) + (1 / Math.cos(c2.lat())));
                    var py1 = Math.log(Math.tan(p1.lat()) + (1 / Math.cos(p1.lat())));
                    var py2 = Math.log(Math.tan(p2.lat()) + (1 / Math.cos(p2.lat())));

                    var tr1 = py1 - cy1;
                    var tr2 = py2 - cy2;


                    var a = (tr1 * tr1 - tr2 * tr2 + d * d) / (2 * d);

                    var h = Math.sqrt(tr1 * tr1 - a * a);


                    var mx = cx1 + a * (cx2 - cx1) / d;
                    var my = cy1 + a * (cy2 - cy1) / d;

                    var prediction1x = mx + h * (cy2 - cy1) / d;
                    var prediction1y = my + h * (cx2 - cx1) / d;
                    var prediction2x = mx - h * (cy2 - cy1) / d;
                    var prediction2y = my - h * (cx2 - cx1) / d;


                    var tprediction1x = prediction1x + mid.lng();
                    var tprediction1y = Math.atan(Math.sinh(prediction1y));
                    var tprediction2x = prediction2x + mid.lng();
                    var tprediction2y = Math.atan(Math.sinh(prediction2y));

                    var prediction1 = {lng: tprediction1x, lat: tprediction1y};
                    var prediction2 = {lng: tprediction2x, lat: tprediction2y};


                    possiblePositions.push(prediction1);
                    possiblePositions.push(prediction2);

                }
            }
        }
    }

    for (i = 0; i < possiblePositions.length; i++) {
        var curItem = possiblePositions[i];

        addPoint(curItem.lat, curItem.lng, "blue", "", "", 1.0);
    }

}

function resultsCount(major, minor, rssi) {
    var occFound = 0;
    var betterOcc = 0;

    for (var j = 0; j < markers.length; j++) {
        for (var k = 0; k < markers[j].length; k++) {
            if (markers[j][k].beacon.colors.major === major && markers[j][k].beacon.colors.minor === minor) {
                occFound++;
                if (markers[j][k].beacon.rssi < rssi) {
                    betterOcc++;
                }
            }
        }
    }

    return {occFound: occFound, betterOcc: betterOcc}
}

var rad = function (x) {
    return x * Math.PI / 180;
};

var getDistance = function (p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.position.lat - p1.position.lat);
    var dLong = rad(p2.position.lng - p1.position.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.position.lat)) * Math.cos(rad(p2.position.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns the distance in meter
};

//function to evaluate index of result with worst rssi signal among already found for specific beacon
function rssiMax(major, minor) {
    var max = -Infinity;
    var index;
    for (var i = 0; i < markers[indexInMarkersCollection(major, minor)].length; i++) {
        if (markers[indexInMarkersCollection(major, minor)][i].beacon.rssi > max) {
            max = markers[indexInMarkersCollection(major, minor)][i].beacon.rssi;
            index = i;
        }
    }
    return index;
}

function addMarkerToInternalCollection(marker, circle, beacon, major, minor) {
    markers[indexInMarkersCollection(major, minor)].push({marker: marker, circle: circle, beacon: beacon});
}

function indexInMarkersCollection(major, minor) {
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
    return index;
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
        map: map,
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
    var center_pos = {lat: 51.84122169789504, lng: 20.34555584192276};
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
        pixelOffset: new google.maps.Size(0, 0)
    });

    function popup(event) {
        var latitude = event.latLng.lat();
        var longitude = event.latLng.lng();
        var latLng = event.latLng;

        infoWindowHtml = '<div id="iw-text">' +
            '<span id="lat" class="coord">' +
            latitude +
            '</span>' + ', ' +
            '<span id="lng" class="coord">' +
            longitude +
            '</span>' +
            '</div>';
        infoWindow.setContent(infoWindowHtml);
        infoWindow.setPosition(latLng);

        infoWindow.open(map);
        selectText('iw-text');
        document.execCommand('copy');
        clearSelection('iw-text');
        $('#lat').click({elementId: 'lat'}, copyElementText);
        $('#lng').click({elementId: 'lng'}, copyElementText);

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
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + major + "." + minor + '</span><input class="custom-checkbox" type="checkbox" checked="true" onchange="checkboxChanged(event,' + major + ',' + minor + ');"/>';
        beacons.appendChild(div);
    }

    area.setMap(map);
}

function checkboxChanged(event, major, minor) {
    if (event.target.checked) {
        check(major, minor);
    } else {
        uncheck(major, minor);
    }
}

function check(major, minor) {
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = false;
    setMarkersMap(indx, map);
    setCirclesMap(indx, map);
}

function uncheck(major, minor) {
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = true;
    setMarkersMap(indx, null);
    setCirclesMap(indx, null);

}

$(function () {
    var d = new Date(2017, 5, 13, 14, 20);
    // var month = d.getMonth();
    // var day = d.getDate();
    // var year = d.getFullYear();
    // var hour = d.getHours();
    // var minute = d.getMinutes();

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
        setCirclesMap(i, null);
    }
    clearMarkers();
    for (var i = 0; i < polylines.length; i++) {
        polylines[i].setMap(null);
    }
    estimations = [];
    polylines = [];
    var date = $("#datetimepicker1").find("input").val();
    var parts = date.split(".");
    var tail = parts[2].split(" ");
    var hours = tail[1].split(":");
    var dateP = new Date(tail[0], parts[1] - 1, parts[0], hours[0], hours[1]);
    startTime = dateP.getTime();
}

//this function returns approximated distance from beacon
function getApproxDistance(rssi) {

    //TODO:
    // This formula can be used after calculating proper values
    // var A = 0;
    // var B = 0;
    // var C = 0;
    // var R = 59;
    //

    //this formula uses power regression for RSSI signal
    // check out info:
    // https://altbeacon.github.io/android-beacon-library/distance-calculations.html
    // https://altbeacon.github.io/android-beacon-library/distance-calculations2.html
    // var D = A*Math.pow((rssi/R),B)+C;
    // return D;


    //Temporary hardcoded values:
    var X1 = 58;
    var Y1 = 10;
    var X2 = 102;
    var Y2 = 35;

    //linear approximation:
    var a = (Y2 - Y1) / (X2 - X1);
    var b = Y2 - a * X2;

    return a * rssi + b;

}

function setMarkersMap(i, map) {
    for (var j = 0; j < markers[i].length; j++) {
        setMarkerMap(i, j, map);
    }
}

function setMarkerMap(i, j, map) {
    markers[i][j].marker.setMap(map);
    markers[i][j].marker.visible = (map !== null);
}

function setCirclesMap(i, map) {
    for (var j = 0; j < markers[i].length; j++) {
        setCircleMap(i, j, map);
    }
}

function setCircleMap(i, j, map) {
    markers[i][j].circle.setMap(map);
    // markers[i][j].circle.visible = (map !== null);
}

function clearMarkers() {
    var beacons = document.getElementById('beacons');
    for (var i = 0; i < 10; i++) {
        markers[i] = [];
        beacon_filter[i] = false;
        if (beacons !== null) beacons.childNodes[i].childNodes[3].checked = true;
    }
}

function copyElementText(event) {
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

function updateLegend() {
    var legend = document.getElementById('legend');
    while (legend.firstChild) {
        legend.removeChild(legend.firstChild);
    }
    for (var i = 0; i < DRONES.length; i++) {
        var div = document.createElement('div');
        var color = DRONES[i].fields.color;
        var name = DRONES[i].fields.name;
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + name + '</span>';
        legend.appendChild(div);
    }
}
