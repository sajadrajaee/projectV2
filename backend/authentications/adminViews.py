from django.shortcuts import render, redirect, get_object_or_404
from office.models import OfficeEnrollRequests

# def enroll_requests(request):
#     requests = OfficeEnrollRequests.office.filter(status='PENDING')
#     return render(
#         request, 
#         'authentications/adminV/enroll_reqs.html', 
#         {
#             "requests":requests
#         }
#     )
