# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-11 21:19
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('maps', '0008_auto_20170611_2114'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='beacon',
            name='altitude',
        ),
        migrations.RemoveField(
            model_name='beacon',
            name='latitude',
        ),
        migrations.RemoveField(
            model_name='beacon',
            name='longitude',
        ),
    ]
