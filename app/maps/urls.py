from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.render_map, name='render_map'),
    url(r'^getPoint/$', views.get_point, name='get_point'),
]