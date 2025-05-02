import math
import random

class MoshpitGame:
    """
    In-memory game state for a circular Pong (Moshpit) match.
    Manages ball, players, collisions and eliminations.
    """
    def __init__(self):
        # Game parameters
        self.center_x = 300
        self.center_y = 300
        self.radius = 290
        self.paddle_size = math.pi / 6
        self.ball_radius = 8
        self.speed_increment = 0.3
        self.player_speed = 0.03
        self.finished = False
        self.winner = None

        self._init_ball()

        # players: id -> {angle, color, direction, min_angle, max_angle, alive}
        self.players = {}
        self.eliminated = []

    def _init_ball(self):
        self.ball = {
            'x': self.center_x,
            'y': self.center_y,
            'angle': random.uniform(0, 2 * math.pi),
            'speed': 1,
        }

    def _normalize(self, angle):
        return angle % (2 * math.pi)

    def _angular_distance(self, a, b):
        diff = abs(a - b) % (2 * math.pi)
        return min(diff, 2 * math.pi - diff)

    def _reposition_players(self):
        """
        Evenly space all alive players around the circle and compute their paddle zones.
        """
        alive_ids = list(self.players.keys())
        n = len(alive_ids)
        if n == 0:
            return
        angle_step = 2 * math.pi / n
        offset = math.pi / 2
        for idx, pid in enumerate(alive_ids):
            angle = self._normalize(offset + idx * angle_step)
            p = self.players[pid]
            p['angle'] = angle
            half = self.paddle_size / 2
            p['min_angle'] = self._normalize(angle - angle_step / 2)
            p['max_angle'] = self._normalize(angle + angle_step / 2)
            p['direction'] = 0
            p['alive'] = True

    def add_player(self, player_id, color=None):
        """Add a new player and reposition all paddles."""
        if color is None:
            color = f"#{random.randint(0, 0xFFFFFF):06x}"
        # Initialize minimal player data
        self.players[player_id] = {
            'angle': 0,
            'color': color,
            'direction': 0,
            'min_angle': 0,
            'max_angle': 0,
            'alive': True,
        }
        # Re-space all players
        self._reposition_players()


    def end_game(self):
        self.ball['speed'] = 0
        self.finished = True
        alive = [pid for pid, p in self.players.items() if p['alive']]
        self.winner = alive[0] if alive else None
        print(f"🎉 Fin de partie, vainqueur : {self.winner}")


    def remove_player(self, player_id):
        """Eliminate a player and reposition remaining paddles."""
        if player_id in self.players:
            self.eliminated.append(self.players.pop(player_id))
            if len(self.players) == 1:
                self.end_game()
            self._init_ball()
            self._reposition_players()

    def set_player_direction(self, player_id, direction):
        """Set movement direction: -1 (left), 0 (stop), 1 (right)"""
        if player_id in self.players and self.players[player_id]['alive']:
            self.players[player_id]['direction'] = direction

    def _is_wall_collision(self):
        dx = self.ball['x'] - self.center_x
        dy = self.ball['y'] - self.center_y
        dist = math.hypot(dx, dy)
        print(f"⚠️ Distance au mur: {dist:.2f} (rayon {self.radius})")
        return dist >= (self.radius - self.ball_radius)

    def _paddle_at(self, angle):
        """Return player dict if a paddle covers this angle"""
        a = self._normalize(angle)
        for p in self.players.values():
            half = self.paddle_size / 2
            start = self._normalize(p['angle'] - half)
            end = self._normalize(p['angle'] + half)
            if start < end:
                if start <= a <= end:
                    return p
            else:
                if a >= start or a <= end:
                    return p
        return None

    def _expected_player(self, angle):
        """Return player who was supposed to cover this angle"""
        a = self._normalize(angle)
        for p in self.players.values():
            mn, mx = p['min_angle'], p['max_angle']
            if mn < mx:
                if mn <= a <= mx:
                    return p
            else:
                if a >= mn or a <= mx:
                    return p
        return None

    def _handle_miss(self, angle):
        missed = self._expected_player(angle)
        if missed:
            # remove by key: find key by matching dict
            pid = next((k for k,v in self.players.items() if v is missed), None)
            if pid:
                print(f"💀 Joueur {pid} éliminé (angle {angle:.2f})")
                self.remove_player(pid)

    def _check_collision(self):
        if not self._is_wall_collision():
            return
        print(f"⚠️ Collision avec le mur (angle {self.ball['angle']:.2f})")
        dx = self.ball['x'] - self.center_x
        dy = self.ball['y'] - self.center_y
        angle = self._normalize(math.atan2(dy, dx))
        paddle = self._paddle_at(angle)
        if paddle:
            print(f"⚡️ Collision avec la raquette {paddle['color']} (angle {angle:.2f})")
            # bounce
            p_center = paddle['angle']
            offset = angle - p_center
            if offset > math.pi: offset -= 2*math.pi
            if offset < -math.pi: offset += 2*math.pi
            self.ball['angle'] = self._normalize(math.pi + self.ball['angle'] + offset * 4)
            self.ball['speed'] += self.speed_increment
        else:
            print(f"❌ Pas de raquette à l'angle {angle:.2f} (miss)")
            self._handle_miss(angle)

    def update(self):
        """Advance one tick: players, ball motion and collisions."""
        # update paddles
        for p in self.players.values():
            p['angle'] = self._normalize(p['angle'] + p['direction'] * self.player_speed)
            # clamp within zone
            mn = self._normalize(p['min_angle'] + self.paddle_size/2)
            mx = self._normalize(p['max_angle'] - self.paddle_size/2)
            a = p['angle']
            if mn > mx:
                if not (a >= mn or a <= mx):
                    d1 = self._angular_distance(a, mn)
                    d2 = self._angular_distance(a, mx)
                    p['angle'] = mn if d1 < d2 else mx
            else:
                if a < mn: p['angle'] = mn
                if a > mx: p['angle'] = mx
        # update ball
        self.ball['x'] += math.cos(self.ball['angle']) * self.ball['speed']
        self.ball['y'] += math.sin(self.ball['angle']) * self.ball['speed']
        # check collision
        self._check_collision()

    def get_game_state(self):
        """Return serializable snapshot for WebSocket clients"""
        return {
            'players': [
                {
                    'id': pid,
                    'angle': v['angle'],
                    'color': v['color'],
                    'min_angle': v['min_angle'],
                    'max_angle': v['max_angle'],
                }
                for pid, v in self.players.items()
            ],
            'ball': {
                'x': self.ball['x'],
                'y': self.ball['y'],
                'radius': self.ball_radius,
            },
            'finished': self.finished,
            'winner': self.winner,
        }
