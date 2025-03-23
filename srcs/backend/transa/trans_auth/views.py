from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import FortyTwoOpenAuthSerializer


class FortyTwoOpenAuthCallbackView(GenericAPIView):
    serializer_class = FortyTwoOpenAuthSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)
