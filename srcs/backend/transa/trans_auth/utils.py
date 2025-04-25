from uprofiles.models import User


def get_unique_name(base_name):
    username = base_name
    count = 1

    while User.objects.filter(username=username).exists():
        username = f"{username}_{count}"
        count += 1

    return username
