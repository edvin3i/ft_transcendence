from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
	re_path(r"ws/moshpit/$", consumers.MoshpitConsumer.as_asgi()),
]
