from rest_framework.generics import GenericAPIView
from .serializers import FortyTwoAuthSerializer

class FortyTwoCallbackView(GenericAPIView):
    serializer_class = FortyTwoAuthSerializer
    