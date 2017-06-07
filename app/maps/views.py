from django.shortcuts import render
from django.http import HttpResponse
from .models import DronePosition
from django.core import serializers
from droniada.utils import UtilClass


def render_map(request):
    context = {
        'center_lat': 50.089684,
        'center_lng': 20.202649,
        'zoom': 16,
        'marker_size': 5,
        'areacords':[ #clockwise direction
            [50.0931667, 20.1916000], #north-west corner
            [50.0931667, 20.2000000],
            [50.0931667, 20.2066167],
            [50.0903500, 20.2090667],
            [50.0883333, 20.2090667],
            [50.0883333, 20.2029000],
            [50.0883333, 20.2000000],
            [50.0883333, 20.1970000],
            [50.0883333, 20.1926833],
            [50.0906167, 20.1919500],
            [50.0916333, 20.1916000]
        ]
    }
    return render(request, 'maps/map.html', context)


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

