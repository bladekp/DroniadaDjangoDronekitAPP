from django.core import serializers
from django.db.models import Max
from django.db.models import Min
from django.http import HttpResponse
from django.shortcuts import render

from droniada.utils import UtilClass
from .models import Beacon
from .models import Drone
from .models import DronePosition

COLORS = ["#2875e1", "#23be4a", "#7d220c", "#83c9c0", "#9a8f93", "#d3f0d0"]
COLORS_INDX = 0

def render_map(request):
    return render(request, 'maps/map.html')


def get_data(request):
    if request.method == 'GET':
        current_time = str(UtilClass.milis_after_epoch())

        dronepositions = DronePosition.objects.filter(sent=False).order_by('time')
        for droneposition in dronepositions:
            droneposition.sent = True
            droneposition.save()
        dronepositionsjson = serializers.serialize("json", dronepositions)

        beacons = Beacon.objects.filter(sent=False).order_by('time')
        #beaconpositions = "["
        for beacon in beacons:
            #before_pos = DronePosition.objects.filter(drone=beacon.drone).filter(time__lte=beacon.time).order_by('time').last() #last known position before beacon found
            #after_pos = DronePosition.objects.filter(drone=beacon.drone).filter(time__gte=beacon.time).order_by('time').first()  # last known position after beacon found
            #if before_pos and after_pos:
            #    delta_time = after_pos.time - before_pos.time
            #    before_time = beacon.time - before_pos.time
            #    lat_diff = after_pos.latitude - before_pos.latitude
            #    lon_diff = after_pos.longitude - before_pos.longitude
            #    alt_diff = after_pos.altitude - before_pos.altitude
            #    divider = float(before_time) / delta_time
            #    beacon_lat = before_pos.latitude + (lat_diff * divider)
            #    beacon_lon = before_pos.longitude + (lon_diff * divider)
            #    beacon_alt = before_pos.altitude + (alt_diff * divider)
            #    beaconpositions += '{"minor":' + str(beacon.minor) + ',"major":' + str(beacon.major) + ',"rssi":' + str(beacon.rssi) + ',"drone":' + str(beacon.drone.pk) + ',"latitude":' + str(beacon_lat) + ',"longitude":' + str(beacon_lon) + ',"altitude":' + str(beacon_alt) + '},'
            beacon.sent = True
            beacon.save()
        beaconpositions = serializers.serialize("json", beacons)
        #if beaconpositions.endswith(','):
        #    beaconpositions = beaconpositions[:-1]
        #beaconpositions += "]"
        #beaconpositions = beaconpositions.rstrip()
        drones = serializers.serialize("json", Drone.objects.all())
        return HttpResponse(
            '{' +
                '"drones_positions":' + dronepositionsjson + ','
                '"beacons_positions":' + beaconpositions + ','
                '"drones":' + drones + ','
                '"last_success_call_time":' + current_time +
            '}'
            , content_type="application/json")


def save_drone_data(request):
    drone_name = request.GET.get('Drone')
    lat = request.GET.get('Lat')
    lon = request.GET.get('Lon')
    alt = request.GET.get('Alt')
    time = request.GET.get('Time')
    if drone_name is not None and lat is not None and lon is not None and alt is not None and time is not None:
        drone = Drone.objects.filter(name=drone_name).first()
        if drone is None:
            drone = Drone(name=drone_name, time_start=0, color=COLORS[COLORS_INDX % 6])
            drone.save()
            global COLORS_INDX
            COLORS_INDX += 1
        dp = DronePosition(latitude=float(lat), longitude=float(lon), altitude=float(alt), time=time, drone=drone)
        dp.save()
    return HttpResponse('{"status":200}', content_type="application/json")


def save_beacon_data(request):
    drone_name = request.GET.get('Drone')
    lat = request.GET.get('Lat')
    lon = request.GET.get('Lon')
    alt = request.GET.get('Alt')
    major = request.GET.get('Major')
    minor = request.GET.get('Minor')
    rssi = request.GET.get('Rssi')
    time = request.GET.get('Time')
    if drone_name is not None and lat is not None and lon is not None and alt is not None and minor is not None and major is not None and rssi is not None and time is not None:
        drone = Drone.objects.filter(name=drone_name).first()
        if drone is None:
            drone = Drone(name=drone_name, time_start=0, color=COLORS[COLORS_INDX % 6])
            drone.save()
            global COLORS_INDX
            COLORS_INDX += 1
        b = Beacon(latitude=float(lat), longitude=float(lon), altitude=float(alt), rssi=rssi, major=major, minor=minor, time=time, drone=drone)
        b.save()
    return HttpResponse('{"status":200}', content_type="application/json")

