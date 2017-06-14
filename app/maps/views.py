from django.core import serializers
from django.db.models import Max
from django.db.models import Min
from django.http import HttpResponse
from django.shortcuts import render

from droniada.utils import UtilClass
from .models import Beacon
from .models import Drone
from .models import DronePosition

COLORS = ["#2875e1", "#FFA500", "#7d220c", "#ee82ee", "#9a8f93", "#d3f0d0"]
COLORS_INDX = 0

def render_map(request):
    return render(request, 'maps/map.html')


def get_data(request):
    if request.method == 'GET':
        start_time = request.GET.get('StartTime')
        dronepositions = DronePosition.objects.filter(time__gte=start_time).order_by('time')
        dronepositionsjson = serializers.serialize("json", dronepositions)
        beacons = Beacon.objects.filter(time__gte=start_time).order_by('time')
        beaconpositions = serializers.serialize("json", beacons)
        drones = serializers.serialize("json", Drone.objects.all())
        return HttpResponse(
            '{' +
                '"drones_positions":' + dronepositionsjson + ','
                '"beacons_positions":' + beaconpositions + ','
                '"drones":' + drones + ','
                '"current_time":' + str(UtilClass.milis_after_epoch()) +
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
        dp = DronePosition(latitude=float(lat), longitude=float(lon), altitude=float(alt), time=UtilClass.milis_after_epoch(), drone=drone)
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
        b = Beacon(latitude=float(lat), longitude=float(lon), altitude=float(alt), rssi=rssi, major=major, minor=minor, time=UtilClass.milis_after_epoch(), drone=drone)
        b.save()
    return HttpResponse('{"status":200}', content_type="application/json")

