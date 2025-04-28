import math
import random

# Paramètres du jeu
center_x = 300  # Centre du cercle (à ajuster selon le canvas)
center_y = 300
radius = 290  # Rayon du cercle
paddle_size = math.pi / 12  # Taille des paddles
ball_radius = 8  # Rayon de la balle

players = [
    {"angle": 0, "color": "#ff4d4d", "key_left": "ArrowLeft", "key_right": "ArrowRight", "direction": 0, "min_angle": -math.pi / 4, "max_angle": math.pi / 4, "id": "red"},
    {"angle": math.pi / 2, "color": "#4da6ff", "key_left": "ArrowDown", "key_right": "ArrowUp", "direction": 0, "min_angle": math.pi / 4, "max_angle": 3 * math.pi / 4, "id": "blue"},
    {"angle": math.pi, "color": "#4dff4d", "key_left": "a", "key_right": "e", "direction": 0, "min_angle": 3 * math.pi / 4, "max_angle": 5 * math.pi / 4, "id": "green"},
    {"angle": 3 * math.pi / 2, "color": "#ffff4d", "key_left": "q", "key_right": "d", "direction": 0, "min_angle": 5 * math.pi / 4, "max_angle": 7 * math.pi / 4, "id": "yellow"}
]

ball = {
    "x": center_x,
    "y": center_y,
    "angle": random.uniform(0, 2 * math.pi),
    "speed": 2.5
}

eliminated_players = []

# Fonction de normalisation de l'angle
def normalize_angle(angle):
    return angle % (2 * math.pi)

# Fonction pour vérifier si la balle touche le mur
def is_ball_touching_wall():
    dx = ball['x'] - center_x
    dy = ball['y'] - center_y
    distance = math.sqrt(dx * dx + dy * dy)
    return distance >= radius - ball_radius

# Fonction pour obtenir le joueur sur le paddle
def is_paddle_at(angle):
    angle = normalize_angle(angle)
    for player in players:
        start = normalize_angle(player['angle'] - paddle_size / 2)
        end = normalize_angle(player['angle'] + paddle_size / 2)

        if start < end:
            if start <= angle <= end:
                return player
        else:
            if angle >= start or angle <= end:
                return player
    return None

# Fonction pour obtenir le joueur attendu à un angle donné
def get_expected_player(angle):
    angle = normalize_angle(angle)
    for player in players:
        if player['min_angle'] < player['max_angle']:
            if player['min_angle'] <= angle <= player['max_angle']:
                return player
        else:
            if angle >= player['min_angle'] or angle <= player['max_angle']:
                return player
    return None

# Fonction pour mettre à jour la position des joueurs
def update_players():
    speed = 0.03  # Vitesse des joueurs
    for player in players:
        player['angle'] += player['direction'] * speed
        player['angle'] = normalize_angle(player['angle'])

        min_angle = normalize_angle(player['min_angle'] + paddle_size / 2)
        max_angle = normalize_angle(player['max_angle'] - paddle_size / 2)

        if min_angle > max_angle:
            in_zone = player['angle'] >= min_angle or player['angle'] <= max_angle
            if not in_zone:
                dist_to_min = angular_distance(player['angle'], min_angle)
                dist_to_max = angular_distance(player['angle'], max_angle)
                player['angle'] = min_angle if dist_to_min < dist_to_max else max_angle
        else:
            if player['angle'] < min_angle: player['angle'] = min_angle
            if player['angle'] > max_angle: player['angle'] = max_angle

# Fonction pour gérer la collision de la balle avec les paddles
def check_ball_collision():
    if not is_ball_touching_wall():
        return

    dx = ball['x'] - center_x
    dy = ball['y'] - center_y
    angle = normalize_angle(math.atan2(dy, dx))

    player = is_paddle_at(angle)

    if player:
        paddle_center = normalize_angle(player['angle'])
        offset = angle - paddle_center
        if offset > math.pi: offset -= 2 * math.pi
        if offset < -math.pi: offset += 2 * math.pi

        bounce_strength = 4
        ball['angle'] = normalize_angle(math.pi + ball['angle'] + offset * bounce_strength)
        ball['speed'] += 0.3  # Accélération
    else:
        handle_miss(angle)

# Fonction pour gérer les erreurs de manque
def handle_miss(angle):
    missed_player = get_expected_player(angle)
    if missed_player:
        players.remove(missed_player)
        eliminated_players.append(missed_player)
        if len(players) == 1:
            win_screen(players[0])

# Fonction pour afficher l'écran de victoire
def win_screen(winner):
    print(f"🏆 Joueur {winner['id']} gagne !")

# Fonction de mise à jour de la balle
def update_ball():
    ball['x'] += math.cos(ball['angle']) * ball['speed']
    ball['y'] += math.sin(ball['angle']) * ball['speed']

# Fonction pour dessiner le cercle (de base)
def draw_game_circle():
    update_players()
    update_ball()
    check_ball_collision()

# Fonction pour redémarrer le jeu
def continue_game():
    angle_step = 2 * math.pi / len(players)
    offset = math.pi / 2

    for i in range(len(players)):
        angle = normalize_angle(offset + i * angle_step)
        players[i]['angle'] = angle
        players[i]['min_angle'] = normalize_angle(angle - angle_step / 2)
        players[i]['max_angle'] = normalize_angle(angle + angle_step / 2)

    ball['x'] = center_x
    ball['y'] = center_y
    ball['speed'] = 2.5
    ball['angle'] = random.uniform(0, 2 * math.pi)

# Fonction pour obtenir la distance angulaire entre deux angles
def angular_distance(a, b):
    diff = abs(a - b) % (2 * math.pi)
    return min(diff, 2 * math.pi - diff)
