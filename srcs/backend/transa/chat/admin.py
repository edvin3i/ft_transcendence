from django.contrib import admin
from .models import UserBlock, ChatMessage

admin.site.register(ChatMessage)
admin.site.register(UserBlock)


