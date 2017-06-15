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
    infoWindow.open(MAP);
    selectText('iw-text');
    document.execCommand('copy');
    clearSelection('iw-text');
    $('#lat').click({elementId: 'lat'}, copyElementText);
    $('#lng').click({elementId: 'lng'}, copyElementText);
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
    setMarkersMap(indx, MAP);
    setCirclesMap(indx, MAP);
    drawEstimation(indx);
}

function uncheck(major, minor) {
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = true;
    setMarkersMap(indx, null);
    setCirclesMap(indx, null);
    hideEstimation(indx, true, false); // parameters: indx, hidePossiblePositions, hideEstimated
}

function buttonEvent() {

    MARKERS.length = 0;
//    for (var i = 0; i < MARKERS.length; i++) {
//        setMarkersMap(i, null);
//        setCirclesMap(i, null);
//    }
//    clearMarkers();
//    clearDronePolylines();

    var date = $("#datetimepicker1").find("input").val();
    var parts = date.split(".");
    var tail = parts[2].split(" ");
    var hours = tail[1].split(":");
    var dateP = new Date(tail[0], parts[1] - 1, parts[0], hours[0], hours[1]);
    START_TIME = dateP.getTime();
}

function clearDronePolylines() {
    for (var i = 0; i < DRONES.length; i++) {
        for (var j = 0; j < DRONES[i].polylines.length; j++) {
            DRONES[i].polylines[j].setMap(null);
        }
        DRONES[i].polylines = [];
    }
}

function legendCheckboxChanged(event, drone_id){
    var drone = findDrone(drone_id);
    if (event.target.checked) {
        var map = MAP;
    } else {
        var map = null;
    }
    for (var i = 0; i < drone.polylines.length; i++){
        drone.polylines[i].setMap(map);
    }
}