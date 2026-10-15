from rest_framework import serializers

MAX_BYTES = 3 * 1024 * 1024


def validate_image_size(f):
    if f and f.size > MAX_BYTES:
        raise serializers.ValidationError("Image trop lourde (3 Mo maximum).")
    return f
