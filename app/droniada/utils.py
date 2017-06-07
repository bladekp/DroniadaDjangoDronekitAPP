from datetime import datetime
import time


class UtilClass(object):

    @staticmethod
    def milis_after_epoch():
        dt = datetime.now()
        return time.mktime(dt.timetuple()) + dt.microsecond
