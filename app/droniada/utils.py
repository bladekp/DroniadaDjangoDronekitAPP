import time


class UtilClass(object):

    @staticmethod
    def milis_after_epoch():
        return time.time() * 1000
