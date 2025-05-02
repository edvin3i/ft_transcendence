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
            'player', flat=True
        )
    )

    if len(players) != tour.max_players:
        raise ValidationError(
            f"Needs the {tour.max_players} players, but only {len(players)} now."
        )

    # randomize
    random.shuffle(players)

    # round number one
    current_round = []
    round_no = 1
    size = len(players)

    for i in range(0, size, 2):
        p1, p2 = players[i], players[i + 1]
        if p2 is None: # for bye matches (when p2 in None)
            bye_match = Match.objects.create(
                tournament=tour,
                round_number=round_no,
                player1_id=p1,
                player2_id=p1,
                winner_id=p1,
                is_finished=True,
            )
            current_round.append(bye_match)
        else:
            m = Match.objects.create(
                tournament=tour,
                round_number=round_no,
                player1_id=p1,
                player2_id=p2,
            )
            current_round.append(m)


    while len(current_round) > 1:
        round_no += 1
        next_round = []
        for i in range(0, len(current_round), 2):
            m1, m2 = current_round[i], current_round[i + 1]
            m_next = Match.objects.create(
                tournament=tour,
                round_number=round_no,
                prev_match_1=m1,
                prev_match_2=m2,
            )
            next_round.append(m_next)
        current_round = next_round

    tour.is_started = True
    tour.save(update_fields=["is_started"])
