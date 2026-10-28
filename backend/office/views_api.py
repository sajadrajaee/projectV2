from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from rest_framework import status
from authentications.models import User
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .models import (
    House,
    Office,
    Note,
    OfficeDeal
)
from .serializers import (
    HouseSerializer,
    OfficeSerializer,
    NoteSerialzier,
    HouseCreateSerializer,
    OfficeDealSerializer,
    OfficeProfileSerializer,
    PublicOfficeProfileSerializer,
    HouseUpdateSerializer
)
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOfficeUser
from drf_spectacular.utils import extend_schema
from .pagination import Paginations
from rest_framework.decorators import throttle_classes
from .common.throttles import (
    HouseCreateBurstThrottle,
    HouseCreateHourlyThrottle,
)


# Houses model section 


@extend_schema(
    responses={200: HouseSerializer}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def office_home_api(request):
  
    office = get_object_or_404(
        Office,
        admin=request.user
    )

    houses = House.objects.filter(
        office=office
    )

    area = request.query_params.get('area')

    if area:
        houses = houses.filter(
            area__icontains=area
        )
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(houses, request) 
    serializer = HouseSerializer(
        paginated_houses,
        many=True
    )

    return paginator.get_paginated_response(serializer.data)


@extend_schema(responses={201: HouseCreateSerializer})
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated, IsOfficeUser])
@throttle_classes([HouseCreateBurstThrottle, HouseCreateHourlyThrottle])
def create_post_api(request):
    office = get_object_or_404(Office, admin=request.user)

    serializer = HouseCreateSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(office=office)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def update_house_api(request, id):
    office = get_object_or_404(Office, admin=request.user)
    house = get_object_or_404(House, office=office, id=id)
    if request.method == 'GET':
        serializer = HouseSerializer(house)
        return Response(serializer.data)
    if request.method in ['PUT', 'PATCH']:
        serializer = HouseUpdateSerializer(
            house,
            data=request.data,
            partial = request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                HouseSerializer(house).data, # serializer.data
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )
    elif request.method == 'DELETE':
        house.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# public houses for users
@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_houses(request):
    houses = House.objects.filter(status='AVAILABLE')
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(houses, request) 
    serializer = HouseSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(serializer.data)

# user get house's detail
@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_house_detail(request, id):
    house = get_object_or_404(House, id=id)
    return Response(
        HouseSerializer(house).data 
    )

@extend_schema(
        responses={
            200:OfficeSerializer
        }
)
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def office_profile_api(request):
    office = get_object_or_404(Office, admin=request.user)
    if request.method == 'GET':
        serializer = OfficeProfileSerializer(office)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = OfficeProfileSerializer(
            office, 
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@extend_schema(
    responses={200: HouseSerializer}
)
@api_view(['GET'])
def get_khana_api(request):
    khana = House.objects.filter(property_type='KHANA', status='AVAILABLE')
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(khana, request) 
    serializer = HouseSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(serializer.data)

@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_zamin_api(request):
    zamin = House.objects.filter(property_type='ZAMIN', status='AVAILABLE')
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(zamin, request) 
    serializer = HouseSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(serializer.data)

@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_dokan_api(request):
    dokan = House.objects.filter(property_type='DOKAN', status='AVAILABLE')
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(dokan, request) 
    serializer = HouseSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(
        serializer.data 
    )

@extend_schema(
        responses={
            200:PublicOfficeProfileSerializer
        }
)
@api_view(['GET'])
def get_offices_api(request):
    offices = Office.objects.all()

    q = request.query_params.get('q')

    if q:
        offices = offices.filter(name__icontains=q)
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(offices, request) 
    serializer = PublicOfficeProfileSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(
        serializer.data 
    )

@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_office(request,id): # office profile
    office = get_object_or_404(Office, id=id)
    serializer = PublicOfficeProfileSerializer(office)
    posts = House.objects.filter(office=office)
    post_serializer = HouseSerializer(posts, many=True)
    return Response(
        {
            "office":serializer.data,
            "posts": post_serializer.data
        }
    )

@api_view(['GET'])
def registered_area_api(request):
    area = House.objects.filter(status='AVAILABLE')
    area_names = [name.area for name in area]
    return Response(
        {
            "areanames":area_names
        }
    )


@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(['GET'])
def get_area_houses_api(request, area_name): # houses based on area name

    houses = House.objects.filter(area=area_name)
    paginator = Paginations()
    paginated_houses = paginator.paginate_queryset(houses, request) 
    serializer = HouseSerializer(paginated_houses, many=True)
    return paginator.get_paginated_response(
        serializer.data 
    )


# notes api management section

@extend_schema(
        responses={
            200:NoteSerialzier
        }
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def note_management_api(request):

    office = get_object_or_404(
        Office,
        admin=request.user
    )
    if request.method == 'GET':
        notes = Note.objects.filter(admin=office)
        paginator = Paginations()
        paginated_houses = paginator.paginate_queryset(notes, request) 
        serializer = NoteSerialzier(paginated_houses, many=True)

        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        serializer = NoteSerialzier(data=request.data)

        if serializer.is_valid():
            serializer.save(admin=office)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

@extend_schema(
        responses={
            200:NoteSerialzier
        }
)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def retrieve_note_api(request, note_id):

    office = get_object_or_404(
        Office,
        admin=request.user
    )

    note = get_object_or_404(
        Note,
        id=note_id,
        admin=office
    )

    if request.method == 'GET':
        serializer = NoteSerialzier(note)

        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = NoteSerialzier(
            note,
            data=request.data,
            partial=request.method == 'PATCH'
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    elif request.method == 'DELETE':
        note.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

# deals management
@extend_schema(
    responses={200: OfficeDeal}
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def deals_api(request):
    office = get_object_or_404(Office, admin=request.user)
    deals = OfficeDeal.objects.filter(office=office)
    if request.method == 'GET':
        serializer = OfficeDealSerializer(deals, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = OfficeDealSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(office=office)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsOfficeUser])
def deal_retrieve_api(request, id):
    office = get_object_or_404(Office, admin=request.user)
    deal = get_object_or_404(OfficeDeal, office=office, id=id)
    if request.method == 'GET':
        serializer = OfficeDealSerializer(deal)
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
        serializer = OfficeDealSerializer(
            deal,
            data=request.data,
            partial = request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data, status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    
# reports api management

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsOfficeUser])
def reports_api(request):


    office = get_object_or_404(Office, admin=request.user)
    deals = OfficeDeal.objects.filter(office=office)
    houses = House.objects.filter(office=office)

    data = {
        "office_id": office.id,
        "dealed": deals.filter(status="DEALED").count(),
        "dealing": deals.filter(status="DEALING").count(),
        "canceled": deals.filter(status="CANCELED").count(),

        # Rental houses available
        "renthouse": houses.filter(
            listing_type="RENT",
            status="AVAILABLE"
        ).count(),

        # Sale houses available
        "salehouse": houses.filter(
            listing_type="SALE",
            status="AVAILABLE"
        ).count(),

        # Gerawi houses available
        "gerawihouse": houses.filter(
            listing_type="GERAWI",
            status="AVAILABLE"
        ).count(),

        "available": houses.filter(status="AVAILABLE").count(),
        "SOLD": houses.filter(status="SOLD").count(),
        "RENTED": houses.filter(
            status="RENTED",
            listing_type="RENT"
        ).count(),
    }

    return Response(data)


def share(request, id):
    # share posts on whatsapp
    pass 