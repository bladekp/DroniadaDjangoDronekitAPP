from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.render_map, name='render_map'),
    url(r'^getData/$', views.get_data, name='get_data'),
]