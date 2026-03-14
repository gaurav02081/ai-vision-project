import mediapipe as mp
import cv2
import numpy as np
import base64
import math
import threading


class GestureControlService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(GestureControlService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized'):
            return

        self.mp_hands = mp.solutions.hands
        self.process_lock = threading.Lock()

        try:
            self.hands = self.mp_hands.Hands(
                static_image_mode=True,
                max_num_hands=2,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            self._initialized = True
            print("MediaPipe Hands initialized successfully")
        except Exception as e:
            print(f"MediaPipe initialization error: {e}")
            self.hands = None
            self._initialized = False

    def process_hand_gestures(self, frame_base64):
        try:
            if not self._initialized or self.hands is None:
                return {'error': 'MediaPipe not properly initialized'}

            frame_data = base64.b64decode(frame_base64)
            frame_array = np.frombuffer(frame_data, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

            if frame is None:
                return {'error': 'Failed to decode frame'}

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_rgb.setflags(write=False)

            try:
                with self.process_lock:
                    hands_results = self.hands.process(frame_rgb)
            except Exception as mp_error:
                return {'error': f'MediaPipe processing failed: {str(mp_error)}'}
            finally:
                try:
                    frame_rgb.setflags(write=True)
                except Exception:
                    pass

            results = {
                'hands': None,
                'gestures': [],
                'ui_actions': [],
                'stats': {},
                'educational_info': {}
            }

            if hands_results.multi_hand_landmarks:
                results['hands'] = self._extract_hands_landmarks(
                    hands_results.multi_hand_landmarks, hands_results.multi_handedness
                )
                results['gestures'] = self._detect_hand_gestures(results['hands'])
                results['ui_actions'] = self._map_gestures_to_actions(results['gestures'])

            results['stats'] = self._generate_stats(results)
            results['educational_info'] = self._get_educational_info()
            return results

        except Exception as e:
            return {'error': str(e)}

    def _extract_hands_landmarks(self, multi_hand_landmarks, multi_handedness):
        hands = []
        for idx, hand_landmarks in enumerate(multi_hand_landmarks):
            raw = multi_handedness[idx].classification[0].label if multi_handedness else 'Unknown'
            confidence = multi_handedness[idx].classification[0].score if multi_handedness else 0.0
            handedness = 'Right' if raw == 'Left' else ('Left' if raw == 'Right' else raw)

            landmarks = []
            for i, lm in enumerate(hand_landmarks.landmark):
                landmarks.append({'id': i, 'x': float(lm.x), 'y': float(lm.y), 'z': float(lm.z)})

            hands.append({'handedness': handedness, 'confidence': float(confidence), 'landmarks': landmarks})
        return hands

    def _detect_hand_gestures(self, hands_data):
        gestures = []
        for hand in hands_data:
            lm = hand['landmarks']
            h = hand['handedness']
            if self._is_thumbs_up(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'Thumbs Up', 'emoji': '\U0001f44d', 'handedness': h, 'confidence': 0.95, 'action': 'next'})
            elif self._is_peace_sign(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'Peace Sign', 'emoji': '\u270c\ufe0f', 'handedness': h, 'confidence': 0.95, 'action': 'previous'})
            elif self._is_pointing(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'Pointing', 'emoji': '\U0001f446', 'handedness': h, 'confidence': 0.90, 'action': 'select'})
            elif self._is_fist(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'Fist', 'emoji': '\u270a', 'handedness': h, 'confidence': 0.90, 'action': 'close'})
            elif self._is_ok_sign(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'OK Sign', 'emoji': '\U0001f44c', 'handedness': h, 'confidence': 0.90, 'action': 'confirm'})
            elif self._is_open_hand(lm):
                gestures.append({'type': 'hand_gesture', 'name': 'Open Hand', 'emoji': '\U0001f450', 'handedness': h, 'confidence': 0.85, 'action': 'menu'})
        return gestures

    def _map_gestures_to_actions(self, gestures):
        return [{'gesture': g['name'], 'emoji': g['emoji'], 'action': g['action'], 'handedness': g['handedness'], 'confidence': g['confidence']} for g in gestures]

    def _is_thumbs_up(self, lm):
        if lm[4]['y'] < lm[3]['y']:
            tips = [lm[8], lm[12], lm[16], lm[20]]
            pips = [lm[6], lm[10], lm[14], lm[18]]
            return sum(1 for t, p in zip(tips, pips) if t['y'] > p['y']) >= 3
        return False

    def _is_peace_sign(self, lm):
        return (lm[8]['y'] < lm[6]['y'] and lm[12]['y'] < lm[10]['y']
                and lm[16]['y'] > lm[14]['y'] and lm[20]['y'] > lm[18]['y'])

    def _is_pointing(self, lm):
        index_up = lm[8]['y'] < lm[6]['y']
        others = all(lm[t]['y'] > lm[p]['y'] for t, p in [(12, 10), (16, 14), (20, 18)])
        return index_up and others

    def _is_fist(self, lm):
        tips = [lm[8], lm[12], lm[16], lm[20]]
        pips = [lm[6], lm[10], lm[14], lm[18]]
        return sum(1 for t, p in zip(tips, pips) if t['y'] > p['y']) >= 4

    def _is_ok_sign(self, lm):
        d = math.sqrt((lm[4]['x'] - lm[8]['x'])**2 + (lm[4]['y'] - lm[8]['y'])**2)
        return d < 0.05

    def _is_open_hand(self, lm):
        tips = [lm[8], lm[12], lm[16], lm[20]]
        pips = [lm[6], lm[10], lm[14], lm[18]]
        return sum(1 for t, p in zip(tips, pips) if t['y'] < p['y']) >= 4

    def _generate_stats(self, results):
        stats = {'total_landmarks': 0, 'hands_detected': 0, 'gestures_detected': len(results.get('gestures', [])), 'ui_actions_available': len(results.get('ui_actions', []))}
        if results.get('hands'):
            stats['hands_detected'] = len(results['hands'])
            for hand in results['hands']:
                stats['total_landmarks'] += len(hand['landmarks'])
        return stats

    def _get_educational_info(self):
        return {
            'mode': 'hands',
            'description': 'MediaPipe Hands detects 21 landmarks per hand for precise gesture recognition',
            'landmarks_count': 42,
            'capabilities': ['Hand gesture recognition', 'Finger tracking', 'Handedness detection', 'Real-time processing'],
            'use_cases': ['UI control', 'Sign language', 'Virtual controllers', 'AR/VR interaction'],
        }
