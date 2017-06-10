import random
import threading
import time
from datetime import datetime
from django.apps import apps
from random import randint

from utils import UtilClass


class MockThread(object):

    def __init__(self):
        self.drone = apps.get_model("maps.Drone")
        self.beacon = apps.get_model("maps.Beacon")
        self.drone_position = apps.get_model("maps.DronePosition")
        self.drone.objects.all().delete()
        self.beacon.objects.all().delete()
        self.drone_position.objects.all().delete()
        thread = threading.Thread(target=self.run, args=())
        thread.daemon = True
        thread.start()

    def run(self):
        d1 = self.create_mock_drone("Mock Drone 1", "#7FFFD4")
        d2 = self.create_mock_drone("Mock Drone 2", "#1E90FF")
        while True:
            if randint(1, 2) == 1:
                self.create_mock_beacon(d1)
            else:
                self.create_mock_beacon(d2)
            time.sleep(randint(4, 10))

            if randint(1, 2) == 1:
                self.create_mock_position(d1)
            else:
                self.create_mock_position(d2)
            time.sleep(randint(3, 4))

    def create_mock_drone(self, name, color):
        d = self.drone(name=name, time_start=UtilClass.milis_after_epoch(), color=color)
        d.save()
        return d

    def create_mock_beacon(self, drone):
        b = self.beacon(
            major=randint(1, 4),
            minor=randint(1, 4),
            rssi=randint(30, 99),
            time=UtilClass.milis_after_epoch(),
            drone=drone
        )
        b.save()

    def create_mock_position(self, drone):
        b = self.drone_position(
            latitude=random.uniform(50.088, 50.094),
            longitude=random.uniform(20.190, 20.210),
            altitude=random.uniform(0.000, 50.000),
            time=UtilClass.milis_after_epoch(),
            drone=drone
        )
        b.save()
