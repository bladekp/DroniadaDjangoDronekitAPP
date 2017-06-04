from django.shortcuts import render
from django.http import HttpResponse
from .models import Point
import json


def render_map(request):
    points_list = Point.objects.all()  # [:3]
    context = {
        'center_lat': 50.089684,
        'center_lng': 20.202649,
        'zoom': 16,
        'marker_size': 5,
        'points_list': points_list,
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


def get_point(request):
    if request.method == 'GET':
        point = Point.objects.last()
        return HttpResponse(json.dumps({"lat":point.lat, "lng":point.lng}), content_type="application/json")
    else:
        return HttpResponse(json.dumps({'error': 'GET method required'}), content_type="application/json")

