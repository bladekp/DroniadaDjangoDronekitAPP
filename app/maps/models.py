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
    sent = models.BooleanField(default=False)  # TODO: this means we can have at most one client

    def __str__(self):
        return "( lat: " + str(self.latitude) + ", lng: " + str(self.longitude) + ", alt: " + str(self.altitude) + " )"


class Beacon(models.Model):
    major = models.IntegerField()
    minor = models.IntegerField()
    rssi = models.IntegerField()
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    altitude = models.FloatField(default=0.0)
    time = models.BigIntegerField()
    drone = models.ForeignKey(Drone)
    sent = models.BooleanField(default=False) #TODO: this means we can have at most one client

    def __str__(self):
        return "( major: " + str(self.major) + ", minor: " + str(self.minor) + ", rssi: " + str(self.rssi) + " )"
