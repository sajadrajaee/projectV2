from django.test import TestCase
from rest_framework.test import APIClient

from authentications.models import User
from .models import Office


class OfficeProfileContactTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.office_user = User.objects.create_user(
            email='office@example.com',
            password='test-password',
            first_name='Guide',
            last_name='User',
            user_type='OFFICE',
            phone='0700000000',
        )
        self.office = Office.objects.create(admin=self.office_user, name='Test Office')

    def test_office_user_can_read_and_update_contact_numbers(self):
        self.client.force_authenticate(self.office_user)

        response = self.client.get('/api/office/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['admin_phone'], '0700000000')
        self.assertIsNone(response.data['admin_whatsapp'])

        response = self.client.patch('/api/office/profile/', {
            'admin_phone': '+93700000000',
            'admin_whatsapp': '+93711111111',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.office_user.refresh_from_db()
        self.assertEqual(self.office_user.phone, '+93700000000')
        self.assertEqual(self.office_user.whatsapp, '+93711111111')
        self.assertEqual(response.data['admin_whatsapp'], '+93711111111')

    def test_non_office_user_cannot_read_office_profile(self):
        customer = User.objects.create_user(
            email='customer@example.com',
            password='test-password',
            first_name='Customer',
            last_name='User',
            user_type='CUSTOMER',
        )
        self.client.force_authenticate(customer)

        response = self.client.get('/api/office/profile/')

        self.assertEqual(response.status_code, 403)

    def test_public_office_directory_includes_contact_numbers(self):
        self.office_user.whatsapp = '+93711111111'
        self.office_user.save(update_fields=['whatsapp'])

        response = self.client.get('/api/offices/')

        self.assertEqual(response.status_code, 200)
        office = next(item for item in response.data['results'] if item['id'] == self.office.id)
        self.assertEqual(office['admin_phone'], '0700000000')
        self.assertEqual(office['admin_whatsapp'], '+93711111111')
