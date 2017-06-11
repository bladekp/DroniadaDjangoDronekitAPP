# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-11 21:14
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('maps', '0007_droneposition_sent'),
    ]

    operations = [
        migrations.AddField(
            model_name='beacon',
            name='altitude',
            field=models.FloatField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='beacon',
            name='latitude',
            field=models.FloatField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='beacon',
            name='longitude',
            field=models.FloatField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
