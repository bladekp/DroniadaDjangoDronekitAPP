from django.core import serializers
from django.db.models import Max
from django.db.models import Min
from django.http import HttpResponse
from django.shortcuts import render

from droniada.utils import UtilClass
from .models import Beacon
from .models import Drone
from .models import DronePosition


def render_map(request):
    return render(request, 'maps/map.html')


def get_data(request):
    if request.method == 'GET':
        last_success_call_time = request.GET.get('LastSuccessCallTime')
        current_time = str(UtilClass.milis_after_epoch())
        dronepositions = serializers.serialize("json", DronePosition.objects.filter(time__gte=last_success_call_time))
        beacons = Beacon.objects.filter(sent=False)
        beaconpositions = "["
        for beacon in beacons:
            before_pos = DronePosition.objects.filter(drone=beacon.drone).filter(time__lte=beacon.time).order_by('time').last() #last known position before beacon found
            after_pos = DronePosition.objects.filter(drone=beacon.drone).filter(time__gte=beacon.time).order_by('time').first()  # last known position after beacon found
            if before_pos and after_pos:
                delta_time = after_pos.time - before_pos.time
                before_time = beacon.time - before_pos.time
                lat_diff = after_pos.latitude - before_pos.latitude
                lon_diff = after_pos.longitude - before_pos.longitude
                alt_diff = after_pos.altitude - before_pos.altitude
                divider = float(before_time) / delta_time
                beacon_lat = before_pos.latitude + (lat_diff * divider)
                beacon_lon = before_pos.longitude + (lon_diff * divider)
                beacon_alt = before_pos.altitude + (alt_diff * divider)
                beaconpositions += '{"minor":' + str(beacon.minor) + ',"major":' + str(beacon.major) + ',"rssi":' + str(beacon.rssi) + ',"drone":' + str(beacon.drone.pk) + ',"latitude":' + str(beacon_lat) + ',"longitude":' + str(beacon_lon) + ',"altitude":' + str(beacon_alt) + '},'
                beacon.sent = True
                beacon.save() #TODO: this means we can have at most one client


        if beaconpositions.endswith(','):
            beaconpositions = beaconpositions[:-1]
        beaconpositions += "]"
        beaconpositions = beaconpositions.rstrip()
        drones = serializers.serialize("json", Drone.objects.all())
        return HttpResponse(
            '{' +
                '"drones_positions":' + dronepositions + ','
                '"beacons_positions":' + beaconpositions + ','
                '"drones":' + drones + ','
                '"last_success_call_time":' + current_time +
            '}'
            , content_type="application/json")

