from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.render_map, name='render_map'),
    url(r'^getData/$', views.get_data, name='get_data'),
    url(r'^saveDroneData/$', views.save_drone_data, name='save_drone_data'),
    url(r'^saveBeaconData/$', views.save_beacon_data, name='save_beacon_data'),
]