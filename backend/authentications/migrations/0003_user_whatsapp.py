from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentications', '0002_alter_user_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='whatsapp',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='WhatsApp'),
        ),
    ]
