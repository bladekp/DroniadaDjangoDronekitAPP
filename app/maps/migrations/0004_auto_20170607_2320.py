# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-07 23:20
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maps', '0003_auto_20170606_2333'),
    ]

    operations = [
        migrations.AlterField(
            model_name='beacon',
            name='major',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='beacon',
            name='minor',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='beacon',
            name='rssi',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='beacon',
            name='time',
            field=models.BigIntegerField(),
        ),
        migrations.AlterField(
            model_name='droneposition',
            name='altitude',
            field=models.FloatField(),
        ),
        migrations.AlterField(
            model_name='droneposition',
            name='latitude',
            field=models.FloatField(),
        ),
        migrations.AlterField(
            model_name='droneposition',
            name='longitude',
            field=models.FloatField(),
        ),
        migrations.AlterField(
            model_name='droneposition',
            name='time',
            field=models.BigIntegerField(),
        ),
    ]