from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from office.models import House, Office


class FrontendBackendIntegrationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="office@example.test",
            password="test-password-123",
            first_name="Test",
            last_name="Office",
            user_type="OFFICE",
        )
        self.office = Office.objects.create(admin=self.user, name="Test Office")
        self.client = APIClient()
        access_token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    def test_health_endpoint_checks_database_connection(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok"})

    @override_settings(CORS_ALLOWED_ORIGINS=["https://frontend.example.test"])
    def test_api_allows_configured_frontend_origin(self):
        response = APIClient().options(
            "/api/home/",
            HTTP_ORIGIN="https://frontend.example.test",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        )

        self.assertEqual(
            response["Access-Control-Allow-Origin"],
            "https://frontend.example.test",
        )

    def test_office_can_create_listing_and_public_detail_reads_it(self):
        response = self.client.post(
            "/api/office/create/",
            {
                "listing_type": "SALE",
                "property_type": "KHANA",
                "description": "Integration test listing",
                "price": "123456",
                "province": "KABUL",
                "district": "13",
                "area": "Test Area",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201, response.data)
        stored_house = House.objects.get(pk=response.data["id"])
        self.assertEqual(stored_house.office, self.office)
        self.assertEqual(stored_house.description, "Integration test listing")

        detail_response = APIClient().get(f"/api/houses/{stored_house.pk}/")

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["description"], "Integration test listing")
        self.assertEqual(detail_response.data["office"]["id"], self.office.pk)
        self.assertEqual(detail_response.data["office"]["name"], "Test Office")
