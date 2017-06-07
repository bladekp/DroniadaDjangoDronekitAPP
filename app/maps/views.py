from django.shortcuts import render
from django.http import HttpResponse
from .models import DronePosition
from django.core import serializers
from droniada.utils import UtilClass


def render_map(request):
    return render(request, 'maps/map.html')


def get_points(request):
    if request.method == 'GET':
        last_success_call_time = request.GET.get('LastSuccessCallTime')
        dronepositions = serializers.serialize("json", DronePosition.objects.filter(time__gte=last_success_call_time))
        beaconpositions = "[]"
        return HttpResponse(
            '{' +
                '"drones_positions":' + dronepositions + ','
                '"beacons_positions":' + beaconpositions + ','
                '"last_success_call_time":' + str(UtilClass.milis_after_epoch()) +
            '}'
            , content_type="application/json")

