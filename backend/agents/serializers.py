from rest_framework import serializers

from core.images import validate_image_size

from .models import AgentModel, FonctionModel


class FonctionSerializer(serializers.ModelSerializer):
    agents = serializers.SerializerMethodField()

    class Meta:
        model = FonctionModel
        fields = ["id", "libelle", "description", "agents"]

    def get_agents(self, o):
        return o.agentmodel_set.count()


class AgentSerializer(serializers.ModelSerializer):
    fonction_libelle = serializers.CharField(source="fonction.libelle", read_only=True)
    statut_label = serializers.CharField(source="get_statut_display", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AgentModel
        exclude = ["created_by"]
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, o):
        return o.image.url if o.image else None

    def validate_image(self, f):
        return validate_image_size(f)
