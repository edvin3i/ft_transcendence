import random
from django.db import transaction
from game.models import Match
from rest_framework.exceptions import ValidationError
from tournaments.models import Tournament, TournamentParticipant


def get_next_power_of_two(n):
    return 1 << (n - 1).bit_length()


@transaction.atomic
def generate_tour_bracket(tour: Tournament):
    if tour.is_started:
        raise ValidationError("Tournament is started already")
    players = list(
        TournamentParticipant.objects.filter(tournament=tour).values_list(
            "player", flat=True
        )
    )

    # randomize
    random.shuffle(players)

    size = get_next_power_of_two()
    players += [None] * (size - len(players))

    current_round = []
    round_no = 1

    for i in range(0, size, 2):
        p1, p2 = players[i], players[i + 1]
        m = Match.objects.create(
            tournament=tour, round_number=round_no, player1_id=p1, player2_id=p2
        )
        current_round.append(m)

    while len(current_round) > 1:
        round_no += 1
        next_round = []
        for i in range(0, len(current_round), 2):
            m1, m2 = current_round[i], current_round[i + 1]
            m_next = Match.objects.create(
                tournament=tour, round_number=round_no, prev_match_1=m1, prev_match_2=m2
            )
            next_round.append(m_next)
        current_round = next_round

    tour.is_started = True
    tour.save(update_fields=["is_started"])
