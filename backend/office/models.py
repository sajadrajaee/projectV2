from django.db import models
from authentications.models import User
import os
from django.utils.translation import gettext_lazy as _



DISTRICTS = [
    ('4',4),
    ('18',18),
    ('6',6),
    ('13',13)
]

PROVINCE = [
    ('KABUL', 'کابل'),
    ('GHAZNI', 'غزنی'),
    ('HERAT', 'هرات')
]

class Office(models.Model):
    class Meta:
        verbose_name = _('دفتر')
        verbose_name_plural = _('دفاتر')

        
    profile = models.ImageField(
        upload_to='office_avatars',
        verbose_name="تصویر",
        null=True,
        blank=True
    )
    admin = models.OneToOneField(
        User, on_delete=models.CASCADE, verbose_name="ادمین"
    )

    name = models.CharField(
        max_length=100, 
        verbose_name="اسم دفتر",
        null=True,
        blank=True
    )
    address = models.CharField(
        max_length=300, 
        verbose_name="آدرس دفتر",
        null=True,
        blank=True
    )

    introduction = models.CharField(
        max_length=280,
        verbose_name="معرفی",
        null=True,
        blank=True
    )
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7,
        null=True, blank=True, verbose_name="عرض جغرافیایی"
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=7,
        null=True, blank=True, verbose_name="طول جغرافیایی"
    )
    def __str__(self):
        return str(self.admin)
    


class House(models.Model):
    # add creation date and time(neccessery)
    class Meta:
        verbose_name = _('ملک')
        verbose_name_plural = _('املاک')
    LISTING_TYPE = [
        ("RENT", "کرایی"),
        ("SALE", "فروشی"),
        ("GERAWI", "گروی")
    ]

    PROPERTY_TYPE = [
        ("ZAMIN", "زمین"),
        ("KHANA", "خانه"),
        ("DOKAN", "دکان"),
        ("HAWILI", "حویلی")
    ]

    STATUS = [
        ("AVAILABLE", "موجود"),
        ("SOLD", "فروخته شده"),
        ("RENTED", "کرایه داده شده")
    ]

    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        verbose_name="دفتر"
    )

    listing_type = models.CharField(
        max_length=10,
        choices=LISTING_TYPE,
        verbose_name="نوع معامله",
        default="RENT"
    )

    property_type = models.CharField(
        max_length=20, 
        verbose_name="نوعیت ملک", 
        default="KHANA", 
        choices=PROPERTY_TYPE,
        null=True, 
        blank=True # TEMP
    )

    description = models.TextField(
        verbose_name="توضیحات", null=True
    )

    price = models.IntegerField(
        verbose_name="قیمت", null=True
    )

    province = models.CharField(
        max_length=15,
        choices=PROVINCE,
        default="KABUL",
        null=True, 
        blank=True,
        verbose_name="ولایت"
    )

    district = models.CharField(
        max_length=10, 
        choices=DISTRICTS, 
        default="13", 
        verbose_name="ناحیه"
    )

    area = models.CharField(
        max_length=100,
        verbose_name="منطقه",
        null=True, 
        blank=True 
    )

    status = models.CharField(
        max_length=15,
        choices=STATUS,
        default="AVAILABLE",
        verbose_name="وضعیت"
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True, verbose_name="تاریخ ایجاد")

    def __str__(self):
        return f"{self.area} - {self.get_listing_type_display()}"


class HouseFile(models.Model):
    class Meta:
            verbose_name = _('فایل جایداد')
            verbose_name_plural = _('فایل های جایداد')
    house = models.ForeignKey(
        House,
        on_delete=models.CASCADE,
        related_name="files",
        verbose_name="خانه"
    )

    file = models.FileField(
        upload_to="houses/",
        verbose_name="فایل",
        null=True,
        blank=True
    )


    def is_image(self):
        extension = os.path.splitext(self.file.name)[1].lower()

        return extension in [   
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
        ]

    @property
    def is_video(self):
        extension = os.path.splitext(self.file.name)[1].lower()

        return extension in [
            ".mp4",
            ".webm",
            ".ogg",
            ".mov",
        ]

    def __str__(self):
        return self.file.name


class OfficeEnrollRequests(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "در انتظار تایید"),
        ("APPROVED", "تایید شده"),
        ('REJECTED', "رد شده")
    ]

    office = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default="PENDING", choices=STATUS_CHOICES)

    def __str__(self):
        return f"{self.office.first_name} - {self.status}"


class OfficeDeal(models.Model):

    class Meta:
            verbose_name = _('قرارداد دفتر')
            verbose_name_plural = _('قرارداد های دفتر')

    DEAL_STATUS = [
        ("DEALED", "معامله شده"),
        ("DEALING", "در حال معامله"),
        ("CANCELED", "لغو شده")
    ]
    
    DEAL_TYPES = [
        ("SALE", "خرید و فروش"),
        ("RENT", "کرایه / اجاره"),
    ]

    office = models.ForeignKey(Office, on_delete=models.CASCADE, verbose_name="دفتر")
    
    # ارتباط با ملکی که قبلاً در سیستم آگهی شده است
    # property = models.ForeignKey(
    #     House, on_delete=models.SET_NULL, null=True, verbose_name="ملک مربوطه"
    # )

    # اطلاعات رسمی سته دولتی برای جلوگیری از جعل
    sata_number = models.CharField(
        max_length=50, unique=True, verbose_name="شماره سریال سته (فرم دولتی)", null=True
    )
    
    deal_type = models.CharField(
        max_length=10, choices=DEAL_TYPES, verbose_name="نوع معامله", default='RENT'
    )

    # اطلاعات طرفین معامله (بهتر استCharField نباشد، چون نیاز به کد ملی/تذکره و تلفن است)
    owner_name = models.CharField(max_length=100, verbose_name="نام مالک (بایع/موجر)", null=True)
    owner_phone = models.CharField(max_length=20, verbose_name="تلفن مالک", null=True)
    
    customer_name = models.CharField(max_length=100, verbose_name="نام مشتری (مشتری/مستاجر)", null=True)
    customer_phone = models.CharField(max_length=20, verbose_name="تلفن مشتری", null=True)

    # بخش مالی
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="قیمت کل معامله (فروش یا کرایه ماهانه)", null=True
    )

    advance_payment = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, verbose_name="مقدار پول پیش / بیعانه"
    )
    currency = models.CharField(
        max_length=10, default="AFN", verbose_name="ارز (افغانی، دالر و...)"
    )

    # حسابداری حق‌العمل (کمیشن دفتر)
    office_commission = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="کمیشن دریافتی دفتر", null=True
    )

    deal_contract = models.FileField(
        upload_to='Contracts/%Y/%m/', 
        verbose_name="اسکن قرارداد رسمی",
        null=True, blank=True
    )
    
    status = models.CharField(
        max_length=15, choices=DEAL_STATUS, default="DEALING", verbose_name="وضعیت"
    )
    
    description = models.TextField(max_length=500, null=True, blank=True, verbose_name="توضیحات")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین ویرایش")

    def __str__(self):
        return f"{self.office.name} - {self.sata_number} ({self.get_deal_type_display()})"


class Note(models.Model):
    class Meta:
            verbose_name = _('یادداشت')
            verbose_name_plural = _('یادداشت ها')

    admin = models.ForeignKey(
        Office, on_delete=models.CASCADE, verbose_name="مدیر"
    )
    title = models.CharField(
        max_length=99, null=True, verbose_name="عنوان"
    )
    description = models.CharField(
        max_length=1000, null=True, verbose_name="توضیحات"
    )
    create_at = models.DateTimeField(
        auto_now_add=True, verbose_name="ایجاد شده در"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="ویرایش شده در"
    )

    def __str__(self):
        return f"{self.title} - {self.admin}"


class OfficeReports(models.Model):
    # all reports should get saved here, 
    # only last 1 month will get displayed on the page

    pass 
