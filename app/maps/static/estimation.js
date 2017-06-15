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


function estimatePosistion() {
    var i;
    var j;
    var k;

    for (i = 0; i < MARKERS.length; i++) {
        var estimation = {possiblePositions: [], result: {}, marker: {}};
        for (j = 0; j < MARKERS[i].measurements.length; j++) {
            for (k = j + 1; k < MARKERS[i].measurements.length; k++) {
                var m1 = MARKERS[i].measurements[j];
                var m2 = MARKERS[i].measurements[k];

                var c1 = new google.maps.LatLng(m1.beacon.position);
                var c2 = new google.maps.LatLng(m2.beacon.position);

                var d = google.maps.geometry.spherical.computeDistanceBetween(c1, c2);

                var r1 = getApproxDistance(m1.beacon.rssi);
                var r2 = getApproxDistance(m2.beacon.rssi);


                if (!((d > (r1 + r2)) || (d < Math.abs(r1 - r2))) && d !== 0) {
                    var x = (d * d - r1 * r1 + r2 * r2) / (2 * d);

                    var h = Math.sqrt(r2 * r2 - x * x);

                    var heading = google.maps.geometry.spherical.computeHeading(c2, c1);

                    var m = google.maps.geometry.spherical.computeOffset(c2, x, heading);

                    var p1 = google.maps.geometry.spherical.computeOffset(m, h, heading - 90);
                    var p2 = google.maps.geometry.spherical.computeOffset(m, h, heading + 90);

                    var p1dist = 0;
                    var p2dist = 0;

                    var n;

                    for (n = 0; n < MARKERS[i].measurements.length; n++) {
                        var temp = new google.maps.LatLng(MARKERS[i].measurements[n].beacon.position);
                        //console.log(temp.lat() + " " + temp.lng() + " " + p1.lat() + " " + p1.lng() + " " + p2.lat() + " " + p2.lng());
                        p1dist += google.maps.geometry.spherical.computeDistanceBetween(p1, temp);
                        p2dist += google.maps.geometry.spherical.computeDistanceBetween(p2, temp);
                    }

                    if (p1dist > p2dist) {
                        estimation.possiblePositions.push(p2);
                    } else {
                        estimation.possiblePositions.push(p1);
                    }
                }
            }
        }
        var latpos = 0;
        var lngpos = 0;
        var n;
        for (n = 0; n < estimation.possiblePositions.length; n++) {
            // console.log(estimation.possiblePositions[n].lat());
            latpos += estimation.possiblePositions[n].lat();
            lngpos += estimation.possiblePositions[n].lng();
            addPoint(estimation.possiblePositions[n].lat(), estimation.possiblePositions[n].lng(), "blue", "", "", 1.0);
        }
        latpos = latpos/n;
        lngpos = lngpos/n;
        if (!(MARKERS[i].estimation === null)) {
            MARKERS[i].estimation.marker.setMap(map);
            MARKERS[i].estimation.marker.visible = (map !== null);
        }
        estimation.result = {lat: latpos, lng: lngpos};

        estimation.marker = addPoint(latpos, lngpos, "orange", "", "", 2.0);
        MARKERS[i].estimation = estimation;
    }
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