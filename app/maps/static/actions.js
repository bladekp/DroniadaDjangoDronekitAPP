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
    setMarkersMap(indx, map);
    setCirclesMap(indx, map);
}

function uncheck(major, minor) {
    var indx = indexInMarkersCollection(major, minor);
    beacon_filter[indx] = true;
    setMarkersMap(indx, null);
    setCirclesMap(indx, null);

}

function buttonEvent() {
    for (var i = 0; i < MARKERS.length; i++) {
        setMarkersMap(i, null);
        setCirclesMap(i, null);
    }
    clearMarkers();
    clearDronePolylines();
    estimations = [];
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

function legendCheckboxChanged(event, drone){
    console.error("Not implemented yet.");
}