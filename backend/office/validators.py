import os
from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_VIDEO_SIZE = 30 * 1024 * 1024      # 30 MB

IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"]


def validate_house_file(file):
    extension = os.path.splitext(file.name)[1].lower()

    if extension in IMAGE_EXTENSIONS:
        max_size = MAX_IMAGE_SIZE
        file_type = "Image"
    elif extension in VIDEO_EXTENSIONS:
        max_size = MAX_VIDEO_SIZE
        file_type = "Video"
    else:
        raise ValidationError("Unsupported file format.")

    if file.size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise ValidationError(
            f"{file_type} size cannot exceed {max_mb:.0f} MB."
        )