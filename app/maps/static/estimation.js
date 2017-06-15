function betterResultsCount(major, minor, rssi) {
    var betterOccurences = 0;
    var beaconIndex = indexInMarkersCollection(major, minor);
    var beaconsMeasuresInTotal = MARKERS[beaconIndex].measurements.length;
    for (var i = 0; i < beaconsMeasuresInTotal; i++) {
        if (MARKERS[beaconIndex].measurements[i].beacon.rssi < rssi) betterOccurences++;
    }
    return betterOccurences
}

//function to evaluate index of result with worst rssi signal among already found for specific beacon
function rssiMax(beaconIndex) {
    var max = -Infinity;
    var index = 0;
    for (var i = 0; i < MARKERS[beaconIndex].measurements.length; i++) {
        if (MARKERS[beaconIndex].measurements[i].beacon.rssi > max) {
            max = MARKERS[beaconIndex].measurements[i].beacon.rssi;
            index = i;
        }
    }
    return index;
}

function estimateBeaconPosition() {
    for (var i = 0; i < MARKERS.length; i++) { //over all beacons
        var estimation = estimatePointsCandidates(i);
        var latpos = 0;
        var lngpos = 0;
        for (var n = 0; n < estimation.possiblePositions.length; n++) {
            latpos += estimation.possiblePositions[n].lat();
            lngpos += estimation.possiblePositions[n].lng();
        }
        estimation.result = {
            lat: latpos / estimation.possiblePositions.length,
            lng: lngpos / estimation.possiblePositions.length
        };
        deleteEstimation(i);
        MARKERS[i].estimation = estimation;
        drawEstimation(i);
    }
}

function drawEstimation(beaconIndex) {
    var possiblePositions = MARKERS[beaconIndex].estimation.possiblePositions;
    for (var i = 0; i < possiblePositions.length; i++) {
        MARKERS[beaconIndex].estimation.possiblePositionsMarkers.push(addPoint(possiblePositions[i].lat(), possiblePositions[i].lng(), "blue", "", "", 1.0));
    }
    if (MARKERS[beaconIndex].estimation.result !== null) {
        MARKERS[beaconIndex].estimation.marker = addPoint(MARKERS[beaconIndex].estimation.result.lat, MARKERS[beaconIndex].estimation.result.lng, "orange", "", "", 2.0);
    }
}

function hideEstimation(beaconIndex) {
    var possiblePositionsMarkers = MARKERS[beaconIndex].estimation.possiblePositionsMarkers;
    for (var i = 0; i < possiblePositionsMarkers.length; i++) {
        possiblePositionsMarkers[i].setMap(null);
        possiblePositionsMarkers[i].visible = true;
    }
    if (MARKERS[beaconIndex].estimation.marker !== null) {
        MARKERS[beaconIndex].estimation.marker.setMap(null);
        MARKERS[beaconIndex].estimation.marker.visible = false;
    }
}

function deleteEstimation(beaconIndex) {
    hideEstimation(beaconIndex);
    MARKERS[beaconIndex].estimation.possiblePositions = [];
    MARKERS[beaconIndex].estimation.possiblePositionsMarkers = [];
    MARKERS[beaconIndex].estimation.marker = null;
    MARKERS[beaconIndex].estimation.result = null;
}

function estimatePointsCandidates(beaconIndex) {
    var estimation = {possiblePositions: [], possiblePositionsMarkers: [], result: {}, marker: {}};
    for (var j = 0; j < MARKERS[beaconIndex].measurements.length; j++) { //over all measurements in beacon
        for (var k = j + 1; k < MARKERS[beaconIndex].measurements.length; k++) { //over all measurements in beacon again
            var measurement_beacon1 = MARKERS[beaconIndex].measurements[j];
            var measurement_beacon2 = MARKERS[beaconIndex].measurements[k];
            var beacon_latlon_position1 = new google.maps.LatLng(measurement_beacon1.beacon.position);
            var beacon_latlon_position2 = new google.maps.LatLng(measurement_beacon2.beacon.position);
            var radius_beacon1 = getApproxDistance(measurement_beacon1.beacon.rssi);
            var radius_beacon2 = getApproxDistance(measurement_beacon2.beacon.rssi);
            var distance_between_beacons = google.maps.geometry.spherical.computeDistanceBetween(beacon_latlon_position1, beacon_latlon_position2);

            if (!((distance_between_beacons > (radius_beacon1 + radius_beacon2)) || (distance_between_beacons < Math.abs(radius_beacon1 - radius_beacon2))) && distance_between_beacons !== 0) {
                var center_between_beacons = (distance_between_beacons * distance_between_beacons - radius_beacon1 * radius_beacon1 + radius_beacon2 * radius_beacon2) / (2 * distance_between_beacons);
                var height = Math.sqrt(radius_beacon2 * radius_beacon2 - center_between_beacons * center_between_beacons);

                var heading = google.maps.geometry.spherical.computeHeading(beacon_latlon_position2, beacon_latlon_position1);

                var m = google.maps.geometry.spherical.computeOffset(beacon_latlon_position2, center_between_beacons, heading);

                var estimated_point1 = google.maps.geometry.spherical.computeOffset(m, height, heading - 90);
                var estimated_point2 = google.maps.geometry.spherical.computeOffset(m, height, heading + 90);

                var point1_distance_sum = 0;
                var point2_distance_sum = 0;

                for (var n = 0; n < MARKERS[beaconIndex].measurements.length; n++) {
                    var temp = new google.maps.LatLng(MARKERS[beaconIndex].measurements[n].beacon.position);
                    point1_distance_sum += google.maps.geometry.spherical.computeDistanceBetween(estimated_point1, temp);
                    point2_distance_sum += google.maps.geometry.spherical.computeDistanceBetween(estimated_point2, temp);
                }

                if (point1_distance_sum > point2_distance_sum) {
                    estimation.possiblePositions.push(estimated_point2);
                } else {
                    estimation.possiblePositions.push(estimated_point1);
                }
            }
        }
    }
    return estimation;
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