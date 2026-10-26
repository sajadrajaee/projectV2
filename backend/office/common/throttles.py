# common/throttles.py
from rest_framework.throttling import ScopedRateThrottle


class HouseCreateBurstThrottle(ScopedRateThrottle):
    scope = "house_create_burst"


class HouseCreateHourlyThrottle(ScopedRateThrottle):
    scope = "house_create"