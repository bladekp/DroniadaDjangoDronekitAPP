var REFRESH_INTERVAL_MS = 600;
var ENDPOINT_URL = "http://localhost:8000/map/getData"; //"http://localhost:8000/map/getData"; "http://remote.jgwservices.com:8000/map/getData";
var START_TIME = 0;
//var START_DATE = new Date();
var START_DATE = new Date(2017, 5, 13, 14, 20);

setInterval(
    function getPoint() {
        $.ajax({
            type: "GET",
            url: ENDPOINT_URL + "/?StartTime=" + START_TIME,
            dataType: "json",
            success: parseSuccess,
            error: errorHandler
        });
    },
    REFRESH_INTERVAL_MS
);

function errorHandler(response, options, error) {
    console.error("Error while trying to retrieve beacon and drone data from server.");
    console.error(response);
    console.error(response.responseText);
    console.log(error);
}

function parseSuccess(response) {
    START_TIME = response.current_time;
    updateDrones(response.drones);
    addDronesPolyline(response.drones_positions);
    addBeaconPoints(response.beacons_positions);
}

$(function () {
    $('#datetimepicker1')
        .datetimepicker({
            locale: 'pl',
            defaultDate: START_DATE
        });
    START_TIME = START_DATE.getTime();
});