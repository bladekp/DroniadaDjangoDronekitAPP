# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import dronekit
import exceptions
from datetime import datetime
from django.apps import AppConfig
from django.apps import apps
from django.conf import settings

from mock import MockThread
from utils import UtilClass
from random import randint
import random


class DroniadaConfig(AppConfig):
    name = 'droniada'

    def ready(self):
        self.drone = apps.get_model("maps.Drone")
        self.beacon = apps.get_model("maps.Beacon")
        self.drone_position = apps.get_model("maps.DronePosition")
        #TODO temporary
        #self.drone.objects.all().delete()
        #self.beacon.objects.all().delete()
        #self.drone_position.objects.all().delete()
        if settings.MODE == "MOCK":
            MockThread()
        if settings.MODE == "DRONEKIT":
            try:
                vehicle = dronekit.connect("/dev/ttyUSB0", baud=57600)
                d = self.drone(name="Black Quadrocopter", time_start=0, color="#1E90FF")
                d.save()

                @vehicle.on_message("SYSTEM_TIME")
                def listener(selfx, name, message):
                    if d.time_start == 0:
                        d.time_start = UtilClass.milis_after_epoch() - message.time_boot_ms
                        d.save()
                    print '%s' % message

                @vehicle.on_message("VIBRATION")
                def listener(selfx, name, message):
                    if d.time_start != 0:
                        b = self.beacon(major=message.clipping_0, minor=message.clipping_1, rssi=message.clipping_2, time=d.time_start + message.time_usec, drone=d)
                        b.save()
                    print '%s' % message

                @vehicle.on_message("GLOBAL_POSITION_INT")
                def listener(selfx, name, message):
                    lat = float(message.lat) / 10000000
                    lon = float(message.lon) / 10000000
                    alt = message.alt
                    if lat != 0 and lon != 0 and d.time_start != 0:
                        dp = self.drone_position(latitude=lat, longitude=lon, altitude=alt, time=d.time_start + message.time_boot_ms ,drone=d)
                        dp.save()
                    print '%s' % message

            except exceptions.OSError as e:
                print 'No serial exists!'
            except dronekit.APIException:
                print 'Timeout!'

            #vehicle.close()
        if settings.MODE == "ANDROID":
            print "ANDROID mode"
