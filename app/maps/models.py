from django.db import models
from datetime import datetime


class Drone(models.Model):
    name = models.CharField(max_length=500)
    time_start = models.BigIntegerField()
    color = models.CharField(max_length=20, default="red")

    def __str__(self):
        return "( name: " + str(self.name) + ", time_start: " + str(self.time_start) + " )"


class DronePosition(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.FloatField()
    time = models.BigIntegerField()
    drone = models.ForeignKey(Drone)

    def __str__(self):
        return "( lat: " + str(self.latitude) + ", lng: " + str(self.longitude) + ", alt: " + str(self.longitude) + " )"


class Beacon(models.Model):
    major = models.IntegerField()
    minor = models.IntegerField()
    rssi = models.IntegerField()
    time = models.BigIntegerField()
    drone = models.ForeignKey(Drone)

    def __str__(self):
        return "( major: " + str(self.major) + ", minor: " + str(self.minor) + ", rssi: " + str(self.rssi) + " )"
