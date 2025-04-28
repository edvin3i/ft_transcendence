from django.contrib import admin

#paul added can be trashed
from .models import MoshpitMatch

admin.site.register(MoshpitMatch)
