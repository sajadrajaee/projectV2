from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .models import House, HouseFile, Office, DISTRICTS, PROVINCE, OfficeDeal, Note
from .forms import CreateFileForm, CreateForm, ProfileUpdateForm, DealCreationForm, NoteUpdateForm, DealUpdateFrom
from django.core.exceptions import PermissionDenied
from authentications.models import User
from django.db.models import Q
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit

def is_office_user(user):
    """
    Returns True only if the user is authenticated and has user_type 'OFFICE'.
    """
    if not user.is_authenticated:
        return False
    if getattr(user, 'user_type', None) != 'OFFICE':
        raise PermissionDenied 
    return True

@user_passes_test(is_office_user, login_url='authentications:login_user')
def office_home(request): # done
    office = Office.objects.get(admin=request.user)
    houses = House.objects.filter(office=office)

    listing_type = request.GET.get('listing_type')
    province = request.GET.get('province')
    area = request.GET.get('area')

    if listing_type:
        houses = houses.filter(listing_type=listing_type)
    if province:
        houses = houses.filter(province=province)
    if request.GET.get('district'):
        houses = houses.filter(district=request.GET.get('district'))

    if area:
        houses = houses.filter(
            Q(
                area__icontains=area
            )
        )
    
    return render(
        request, 
        'authentications/office_home.html',
        {
            "houses":houses,
            "districts":DISTRICTS,
            "provinces":PROVINCE,
            "office":office
        }
    )


def create_post(request): # done
    if request.method == 'POST':
        create_form = CreateForm(request.POST)
        create_file_form = CreateFileForm(request.POST, request.FILES) 
        if create_form.is_valid() and create_file_form.is_valid():
            house = create_form.save(commit=False)
            house.office = Office.objects.get(admin=request.user)
            house.save()

            # Create HouseFile for every uploaded file
            files = create_file_form.cleaned_data["files"]

            for file in files:
                HouseFile.objects.create(
                    house=house,
                    file=file
                )

            return redirect("office:office_home")
        messages.error(request, 'مشکلی رخ داده است، دوباره تلاش کنید.')
        return redirect('office:create_post')

    create_form = CreateForm()
    create_file_form = CreateFileForm()

    return render(
        request, 
        'office/create_p.html', 
        {
            "create_form":create_form,
            "create_file_form":create_file_form
        }
    )
            

def list_houses(request): # done
    office = Office.objects.get(admin=request.user)
    houses = House.objects.filter(office=office)
    context = {
        "houses":houses
    }
    return render(request, 'office/list_house.html', context)

def update_post(request, id): # done
    house = House.objects.get(id=id)
    
    if request.method == 'POST':
        create_form = CreateForm(request.POST, instance=house)
        create_file_form = CreateFileForm(request.POST, request.FILES, instance=house)

        if create_form.is_valid() and create_file_form.is_valid():
            create_form.save()
            create_file_form.save()

            files = create_file_form.cleaned_data["files"]

            for file in files:
                HouseFile.objects.create(
                    house=house,
                    file=file
                )


            return redirect('office:office_home')
        messages.error(request, 'خطا رخ داد')
        return redirect('office:office_home')
    create_form = CreateForm(instance=house)
    create_file_form = CreateFileForm(instance=house)

    return render(
        request, 
        'office/update.html', 
        {
            "create_form":create_form,
            "create_file_form":create_file_form
        }
    )    

def delete_post(request, id): # done
    house = House.objects.get(id=id, office=get_object_or_404(Office, admin=request.user))
    house.delete()
    return redirect('office:office_home') 

# detail of post in office admin panel
def detail_post(request, id): # done
    office = Office.objects.get(admin=request.user)
    house = get_object_or_404(House, id=id, office=office) 
    return render(
        request, 'office/detail.html', {"house":house}
    )

# this is in customer feed page
def detail_post_(request, id):
    house = get_object_or_404(House, id=id)
    # office = get_object_or_404(Office)
    return render(request, "office/detail_post_.html", {"house":house})

def office_profile(request):
    off = Office.objects.get(admin=request.user)
    return render(
        request, 'office/off_profile.html', {"office":off}
    )   

# for user 
def get_office_profile(request,id):
    office = get_object_or_404(Office,id=id)
    available_houses = House.objects.filter(office=office, status='AVAILABLE')
    renthouses = available_houses.filter(listing_type='RENT')
    salehouses = available_houses.filter(listing_type='SALE')
    gerawihouses=available_houses.filter(listing_type='GERAWI')

    return render(
        request, 
        'office/get_office_prof.html', 
        {
            "office":office,
            "houses":available_houses,
            'rents':renthouses,
            'sales':salehouses,
            'gerawi':gerawihouses
        }
    )

def office_profile_update(request, id): # done
    # off = Office.objects.get(id=id, admin=request.user)
    off = get_object_or_404(Office, id=id, admin=request.user)
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, request.FILES, instance=off)
        if form.is_valid():
            form.save()

            messages.success(request, 'پروفایل موفقانه اپدیت شد.')
            return redirect('office:office_profile')
        messages.error(request, 'مشکلی رخ داده است.')
        return redirect('office:office_profile')

    form = ProfileUpdateForm(instance=off)
    return render(
        request, 'office/profile_update.html', {"office":form}
    )


# deals
def deal_management(request):
    office = get_object_or_404(Office, admin=request.user)
    deals =  OfficeDeal.objects.filter(office=office).order_by('-created_at')
    completed = OfficeDeal.objects.filter(status="DEALED").count()
    dealing = OfficeDeal.objects.filter(status = "DEALING", office=office).count()
    cancled = OfficeDeal.objects.filter(status="CANCELED").count()
    return render(
        request,
        'office/deals.html',
        {
            "deals":deals,
            "completed":completed,
            "dealing":dealing,
            "canceled":cancled
        }
    )
    

def create_deal(request):
    
    if request.method == 'POST':
        form = DealCreationForm(request.POST, request.FILES)
        if form.is_valid():
            deal = form.save(commit=False)
            deal.office=Office.objects.get(admin=request.user)
            deal.save()
            messages.success(request, "معامله موفقانه ثبت شد")
            return redirect("office:deal_management")
        messages.error(request, "مشکلی رخ داده است")
        return redirect("office:deal_management")
    form = DealCreationForm()
    return render(
        request, 'office/deal_create.html', {"form":form}
    )

def deal_update(request, id):
    deal = get_object_or_404(OfficeDeal, id=id)
    if request.method == 'POST':
        form = DealUpdateFrom(request.POST, request.FILES, instance=deal)
        if form.is_valid():
            temp = form.save(commit=False)
            temp.office = deal.office
            temp.save()

            return redirect("office:deal_management")
    
    form = DealUpdateFrom(instance=deal)
    return render(
        request, 'office/deal_update.html', {"form":form}
    )

    # how to update the record by following condations ? :
    # 1. if status is 'DEALED', do not allow updating
    # 2. if not 'DEALED', only update deal_contract and status


# notes section
def note_management(request):
    office = Office.objects.get(admin=request.user)
    notes = Note.objects.filter(admin=office)
    return render(
        request, 'office/notes.html', {"notes":notes}
    )

def create_note(request):
    admin = Office.objects.get(admin=request.user)
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')

        obj = Note.objects.create(
            title=title,
            description=description,
            admin = admin
        )

        messages.success(request, 'یادداشت موفقانه اضافه شد')
        return redirect('office:note_management')
    return render(request, 'office/note_create.html')

def update_note(request, id):
    note = Note.objects.get(id=id)
    if request.method == 'POST':
        form = NoteUpdateForm(request.POST, instance=note)
        if form.is_valid():
            form_ = form.save(commit=False)
            form_.admin = Office.objects.get(admin=request.user)
            form_.save()

            messages.success(request, 'یادداشت موفقانه ویرایش شد')
            return redirect(request, 'office:note_management')
        messages.error(request, 'مشکلی رخ داده است')
        return redirect(request, 'office:note_management')
    form = NoteUpdateForm(instance=note)
    return render(
        request, 'office/update_note.html', {"form":form}
    )
def delete_note(request, id):
    note = Note.objects.get(id=id, admin=Office.objects.get(admin=request.user)) 
    note.delete()
    return redirect("office:note_management")


# reports :
def reports(request):
    office = get_object_or_404(Office, admin=request.user)
    deals = OfficeDeal.objects.filter(office=office)
    houses = House.objects.filter(office=office)
    return render(
        request, 
        'office/reports.html', 
        {
            "office":office, 
            "dealed":deals.filter(
                status='DEALED',
            ).count(),
            "dealing":deals.filter(status='DEALING').count(),
            "canceled":deals.filter(
                status='CANCELED'
            ).count(),

            # خانه های کرایی موجود
            "renthouse":houses.filter(
                listing_type="RENT",
                status='AVAILABLE'
            ).count(),

            # خانه های فروشی موجود
            "salehouse":houses.filter(
                listing_type="SALE", 
                status='AVAILABLE'
            ).count(),

            # خانه های گروی
            "gerawihouse":houses.filter(
                listing_type="GERAWI",
                status='AVAILABLE'
            ).count(),

            "available":houses.filter(status="AVAILABLE").count(),
            "SOLD":houses.filter(status="SOLD").count(),
            "RENTED":houses.filter(
                status="RENDTED",
                listing_type='RENT'
            ).count()
        }
    )


def get_dokan(request):
    dokans = House.objects.filter(property_type='DOKAN', status='AVAILABLE')
    return render(
        request, 'office/dokan.html', {"dokans":dokans}
    )

def get_khana(request):
    khana = House.objects.filter(property_type='KHANA', status='AVAILABLE')
    return render(
        request, 'office/khana.html', {"khana":khana}
    )

def get_zamin(request):
    zamin = House.objects.filter(property_type='ZAMIN', status='AVAILABLE')
    return render(
        request, 'office/zamin.html', {"zamin":zamin}
    )


def get_offices(request):
    offices = Office.objects.all()

    query = request.GET.get('q', '').strip()
    if query:
        offices = offices.filter(
            Q(name__icontains=query)
        )

    return render(
        request, 
        'office/offices.html', 
        {
            "offices":offices,
            "query":query
        }
    )


# مناطق ثبت شده
def registered_area(request):
    houses = House.objects.filter(status='AVAILABLE')
    return render(
        request, 'office/registered_a.html', {"houses":houses}
    )

# خانه ها بر اساس منطقه ثبت شده
def get_area_houses(request, area_name):
    houses = House.objects.filter(area=area_name)
    return render(
        request, 'office/get_area_h.html', {"houses":houses} 
    )

# @ratelimit(key='user', rate='5/m', block=True)
# def save_post(request, id):
#     if request.method == 'POST':
#         post = get_object_or_404(House, id=id)
#         saved_item, created = SavedPost.objects.get_or_create(user=request.user, post=post)

#         if not created:
#             saved_item.delete()
#             saved = False
#         else:
#             saved = True
#         return JsonResponse(
#             {
#                 "status":"success",
#                 'saved':saved
#             }
#         )
#     return JsonResponse(
#         {
#             "status":"fail", 'message':"invalid request method"
#         },
#         status=400
#     )


# def saved_posts(request):
#     posts = SavedPost.objects.filter(user=request.user)
#     return render(request, 'office/saved_posts.html', {"posts":posts})





