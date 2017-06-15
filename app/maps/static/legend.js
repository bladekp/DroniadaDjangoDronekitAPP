function updateLegend(drones) {
    var legend = document.getElementById('legend');
    while (legend.firstChild) {
        legend.removeChild(legend.firstChild);
    }
    for (var i = 0; i < drones.length; i++) {
        var div = document.createElement('div');
        var color = drones[i].fields.color;
        var name = drones[i].fields.name;
        div.innerHTML = '<span class="symbol" style="color: ' + color + '">&#9596;</span>  <span class="description">' + name + '</span><input class="custom-checkbox" style="float: right;" type="checkbox" checked="true" onchange="legendCheckboxChanged(event,' + drones[i].pk + ')"/>';
        legend.appendChild(div);
    }
}