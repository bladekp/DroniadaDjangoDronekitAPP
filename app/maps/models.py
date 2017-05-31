from django.db import models


class Point(models.Model):
    lat = models.FloatField(default=0.0)
    lng = models.FloatField(default=0.0)

    def __str__(self):
        return "( lat: " + str(self.lat) + ", lng: " + str(self.lng) + " )"

