from datetime import date

from rest_framework import serializers

from core.images import validate_image_size

from .models import RequerantModel


class RequerantSerializer(serializers.ModelSerializer):
    code = serializers.CharField(read_only=True)
    nom_complet = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RequerantModel
        exclude = ["created_by"]
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, o):
        return o.image.url if o.image else None

    def get_created_by_name(self, o):
        u = o.created_by
        return (u.get_full_name() or u.username) if u else ""

    def validate_image(self, f):
        return validate_image_size(f)

    def validate_date_naissance(self, d):
        if d > date.today():
            raise serializers.ValidationError("La date de naissance ne peut pas être dans le futur.")
        return d
