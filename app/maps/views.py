from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render

from droniada.utils import UtilClass
from .models import Drone
from .models import DronePosition


def render_map(request):
    return render(request, 'maps/map.html')


def get_data(request):
    if request.method == 'GET':
        last_success_call_time = request.GET.get('LastSuccessCallTime')
        current_time = str(UtilClass.milis_after_epoch())
        dronepositions = serializers.serialize("json", DronePosition.objects.filter(time__gte=last_success_call_time))
        beaconpositions = "[]"
        drones = serializers.serialize("json", Drone.objects.all())
        return HttpResponse(
            '{' +
                '"drones_positions":' + dronepositions + ','
                '"beacons_positions":' + beaconpositions + ','
                '"drones":' + drones + ','
                '"last_success_call_time":' + current_time +
            '}'
            , content_type="application/json")

