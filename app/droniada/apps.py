# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.apps import AppConfig
from django.apps import apps
import dronekit
import exceptions
from datetime import datetime
from django.conf import settings
from mock import MockThread


class DroniadaConfig(AppConfig):
    name = 'droniada'

    def ready(self):
        if settings.MOCK:
            MockThread()
        else:
            try:
                vehicle = dronekit.connect("/dev/ttyUSB2", baud=57600)
                drone = apps.get_model("maps.Drone")
                d = drone(name="Black Quadrocopter", start_time=datetime.now)
                d.save()
                beacon = apps.get_model("maps.Beacon")

                @vehicle.on_message("VIBRATION")
                def listener(self, name, message):
                    #TODO time property
                    b = beacon(major=message.clipping_0, minor=message.clipping_1, rssi=message.clipping_2, time=0, drone=d)
                    b.save()
                    print '%s' % message
            except exceptions.OSError as e:
                print 'No serial exists!'
            except dronekit.APIException:
                print 'Timeout!'

            #vehicle.close()

