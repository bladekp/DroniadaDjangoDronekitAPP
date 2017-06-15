//removes becon from application model
function deleteResult(beaconIndex, measureIndex) {
    setMarkerMap(beaconIndex, measureIndex, null);
    setCircleMap(beaconIndex, measureIndex, null);
    MARKERS[beaconIndex].measurements.splice(measureIndex, 1);
}

function indexInMarkersCollection(major, minor) {
    return major === 1 ? 0 : major === 2 ? (0 + minor) : major === 3 ? 2 + minor : 5 + minor;
}

function findDrone(id) {
    for (var i = 0; i < DRONES.length; i++) {
        if (DRONES[i].pk === id) return DRONES[i];
    }
    console.error("Any drone with id " + id + " found.");
}

function getColor(major){
    return major === 4 ? "red" :
           major === 3 ? "yellow" :
           major === 2 ? "green" :
           major === 1 ? "#696969" : "white";
}
