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
        'areacords':[
            #[50.087199, 20.203209],
            [50.093091, 20.191591],
            [50.093167, 20.200020],
            [50.093249, 20.206618],
            [50.091330, 20.206174],
            [50.090358, 20.208735],
            [50.088489, 20.208989],
            [50.086895, 20.210022],
            [50.087296, 20.200286],
            [50.087536, 20.192006],
            [50.090611, 20.191955],
            [50.091635, 20.191672]
        ]
    }
    return render(request, 'maps/map.html', context)


def get_point(request):
    if request.method == 'GET':
        point = Point.objects.last()
        return HttpResponse(json.dumps({"lat":point.lat, "lng":point.lng}), content_type="application/json")
    else:
        return HttpResponse(json.dumps({'error': 'GET method required'}), content_type="application/json")

