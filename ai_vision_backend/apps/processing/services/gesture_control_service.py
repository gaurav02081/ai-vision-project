import mediapipe as mp
import cv2
import numpy as np
import base64
import math
import os
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
        # Prevent re-initialization if already initialized
        if hasattr(self, '_initialized'):
            return
            
        # Initialize MediaPipe Hands only (lightweight)
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        # Serialize access to MediaPipe graph to avoid timestamp mismatch on concurrent requests
        self.process_lock = threading.Lock()
        
        # Initialize hands model with optimized settings and error handling
        try:
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
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

    def close(self):
        """Manually close MediaPipe resources"""
        try:
            if hasattr(self, 'hands') and self.hands is not None:
                self.hands.close()
                self.hands = None
                self._initialized = False
                print("MediaPipe Hands closed successfully")
        except Exception as e:
            print(f"MediaPipe cleanup error: {e}")

    def __del__(self):
        """Cleanup MediaPipe resources"""
        self.close()

    def process_hand_gestures(self, frame_base64):
        """
        Process frame with MediaPipe Hands for gesture recognition and UI control
        """
        try:
            # Check if MediaPipe is properly initialized
            if not self._initialized or self.hands is None:
                return {'error': 'MediaPipe not properly initialized'}
            
            # Decode base64 frame
            frame_data = base64.b64decode(frame_base64)
            frame_array = np.frombuffer(frame_data, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {'error': 'Failed to decode frame'}
            
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Mark image as not writeable to improve performance and avoid unexpected graph mutations
            frame_rgb.setflags(write=False)
            
            # Process with MediaPipe Hands with error handling
            try:
                with self.process_lock:
                    hands_results = self.hands.process(frame_rgb)
            except Exception as mp_error:
                print(f"MediaPipe processing error: {mp_error}")
                return {'error': f'MediaPipe processing failed: {str(mp_error)}'}
            finally:
                # Restore writeable flag
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
                results['hands'] = self._extract_hands_landmarks(hands_results.multi_hand_landmarks, hands_results.multi_handedness)
                results['gestures'] = self._detect_hand_gestures(results['hands'])
                results['ui_actions'] = self._map_gestures_to_actions(results['gestures'])
            
            # Generate statistics and educational info
            results['stats'] = self._generate_stats(results)
            results['educational_info'] = self._get_educational_info()
            
            return results
            
        except Exception as e:
            print(f"Gesture processing error: {e}")
            return {'error': str(e)}

    def _extract_hands_landmarks(self, multi_hand_landmarks, multi_handedness):
        """Extract hand landmarks with handedness (corrected mapping)"""
        hands = []
        for idx, hand_landmarks in enumerate(multi_hand_landmarks):
            raw_handedness = multi_handedness[idx].classification[0].label if multi_handedness else 'Unknown'
            confidence = multi_handedness[idx].classification[0].score if multi_handedness else 0.0
            
            # Correct the handedness mapping (MediaPipe often inverts left/right)
            if raw_handedness == 'Left':
                handedness = 'Right'
            elif raw_handedness == 'Right':
                handedness = 'Left'
            else:
                handedness = raw_handedness
            
            landmarks = []
            for i, landmark in enumerate(hand_landmarks.landmark):
                landmarks.append({
                    'id': i,
                    'x': float(landmark.x),
                    'y': float(landmark.y),
                    'z': float(landmark.z)
                })
            
            hands.append({
                'handedness': handedness,
                'confidence': float(confidence),
                'landmarks': landmarks
            })
        
        return hands

    def _detect_hand_gestures(self, hands_data):
        """Detect hand gestures with improved accuracy"""
        gestures = []
        
        for hand in hands_data:
            landmarks = hand['landmarks']
            handedness = hand['handedness']
            
            # Detect gestures in order of priority
            if self._is_thumbs_up(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Thumbs Up',
                    'emoji': '👍',
                    'handedness': handedness,
                    'confidence': 0.95,
                    'action': 'next'
                })
            elif self._is_peace_sign(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Peace Sign',
                    'emoji': '✌️',
                    'handedness': handedness,
                    'confidence': 0.95,
                    'action': 'previous'
                })
            elif self._is_pointing(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Pointing',
                    'emoji': '👆',
                    'handedness': handedness,
                    'confidence': 0.90,
                    'action': 'select'
                })
            elif self._is_fist(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Fist',
                    'emoji': '✊',
                    'handedness': handedness,
                    'confidence': 0.90,
                    'action': 'close'
                })
            elif self._is_ok_sign(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'OK Sign',
                    'emoji': '👌',
                    'handedness': handedness,
                    'confidence': 0.90,
                    'action': 'confirm'
                })
            elif self._is_wave(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Wave',
                    'emoji': '👋',
                    'handedness': handedness,
                    'confidence': 0.85,
                    'action': 'toggle'
                })
            elif self._is_open_hand(landmarks):
                gestures.append({
                    'type': 'hand_gesture',
                    'name': 'Open Hand',
                    'emoji': '👐',
                    'handedness': handedness,
                    'confidence': 0.85,
                    'action': 'menu'
                })
        
        return gestures

    def _map_gestures_to_actions(self, gestures):
        """Map detected gestures to UI actions"""
        actions = []
        for gesture in gestures:
            action = {
                'gesture': gesture['name'],
                'emoji': gesture['emoji'],
                'action': gesture['action'],
                'handedness': gesture['handedness'],
                'confidence': gesture['confidence']
            }
            actions.append(action)
        return actions

    # Improved gesture detection methods
    def _is_thumbs_up(self, landmarks):
        """Detect thumbs up gesture with improved accuracy"""
        # Thumb tip (4) should be above thumb IP (3)
        # Other fingers should be closed
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        
        # Check if thumb is extended upward
        if thumb_tip['y'] < thumb_ip['y']:
            # Check if other fingers are closed
            finger_tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]
            finger_pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]]
            
            closed_fingers = sum(1 for tip, pip in zip(finger_tips, finger_pips) if tip['y'] > pip['y'])
            return closed_fingers >= 3
        
        return False

    def _is_peace_sign(self, landmarks):
        """Detect peace sign (index and middle finger up)"""
        # Index finger (8) and middle finger (12) should be up
        # Ring finger (16) and pinky (20) should be down
        index_tip = landmarks[8]
        index_pip = landmarks[6]
        middle_tip = landmarks[12]
        middle_pip = landmarks[10]
        ring_tip = landmarks[16]
        ring_pip = landmarks[14]
        pinky_tip = landmarks[20]
        pinky_pip = landmarks[18]
        
        index_up = index_tip['y'] < index_pip['y']
        middle_up = middle_tip['y'] < middle_pip['y']
        ring_down = ring_tip['y'] > ring_pip['y']
        pinky_down = pinky_tip['y'] > pinky_pip['y']
        
        return index_up and middle_up and ring_down and pinky_down

    def _is_pointing(self, landmarks):
        """Detect pointing (index finger extended, others closed)"""
        index_tip = landmarks[8]
        index_pip = landmarks[6]
        other_tips = [landmarks[12], landmarks[16], landmarks[20]]
        other_pips = [landmarks[10], landmarks[14], landmarks[18]]
        
        index_up = index_tip['y'] < index_pip['y']
        others_down = all(tip['y'] > pip['y'] for tip, pip in zip(other_tips, other_pips))
        
        return index_up and others_down

    def _is_fist(self, landmarks):
        """Detect fist (all fingers closed)"""
        finger_tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]
        finger_pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]]
        
        closed_fingers = sum(1 for tip, pip in zip(finger_tips, finger_pips) if tip['y'] > pip['y'])
        return closed_fingers >= 4

    def _is_ok_sign(self, landmarks):
        """Detect OK sign (thumb and index finger touching)"""
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        
        # Calculate distance between thumb and index finger tips
        distance = math.sqrt((thumb_tip['x'] - index_tip['x'])**2 + (thumb_tip['y'] - index_tip['y'])**2)
        
        return distance < 0.05  # Threshold for touching

    def _is_wave(self, landmarks):
        """Detect wave gesture (hand moving side to side)"""
        # This is a simplified wave detection
        # In a real implementation, you'd track hand movement over time
        # For now, we'll detect an open hand with slight movement
        return self._is_open_hand(landmarks)

    def _is_open_hand(self, landmarks):
        """Detect open hand (all fingers extended)"""
        finger_tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]
        finger_pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]]
        
        extended_fingers = sum(1 for tip, pip in zip(finger_tips, finger_pips) if tip['y'] < pip['y'])
        return extended_fingers >= 4

    def _generate_stats(self, results):
        """Generate statistics from detection results"""
        stats = {
            'total_landmarks': 0,
            'hands_detected': 0,
            'gestures_detected': len(results.get('gestures', [])),
            'ui_actions_available': len(results.get('ui_actions', []))
        }
        
        if results.get('hands'):
            stats['hands_detected'] = len(results['hands'])
            for hand in results['hands']:
                stats['total_landmarks'] += len(hand['landmarks'])
        
        return stats

    def _get_educational_info(self):
        """Get educational information about MediaPipe Hands"""
        return {
            'mode': 'hands',
            'description': 'MediaPipe Hands detects 21 landmarks per hand for precise gesture recognition',
            'landmarks_count': 42,  # 21 per hand, up to 2 hands
            'capabilities': [
                'Hand gesture recognition',
                'Finger tracking',
                'Handedness detection',
                'Real-time processing'
            ],
            'use_cases': [
                'UI control',
                'Sign language',
                'Virtual controllers',
                'AR/VR interaction'
            ],
            'gesture_controls': [
                {'gesture': 'Thumbs Up', 'emoji': '👍', 'action': 'Navigate to next feature'},
                {'gesture': 'Peace Sign', 'emoji': '✌️', 'action': 'Go back to previous feature'},
                {'gesture': 'Pointing', 'emoji': '👆', 'action': 'Select/click items'},
                {'gesture': 'Fist', 'emoji': '✊', 'action': 'Close current view'},
                {'gesture': 'OK Sign', 'emoji': '👌', 'action': 'Confirm/accept'},
                {'gesture': 'Wave', 'emoji': '👋', 'action': 'Toggle between features'},
                {'gesture': 'Open Hand', 'emoji': '👐', 'action': 'Open menu'}
            ]
        }

    # Legacy method for backward compatibility
    def process_gesture(self, image_path):
        """Legacy method for backward compatibility"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'landmarks': [],
                    'ai_description': 'Failed to load image.',
                    'technical_summary': 'Image loading failed.'
                }

            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.hands.process(image_rgb)

            if not results.multi_hand_landmarks:
                return {
                    'landmarks': [],
                    'ai_description': 'No hands detected in the image.',
                    'technical_summary': 'Hand detection failed - no landmarks found.'
                }

            hands_data = self._extract_hands_landmarks(results.multi_hand_landmarks, results.multi_handedness)
            gestures = self._detect_hand_gestures(hands_data)

            return {
                'landmarks': hands_data,
                'gestures': gestures,
                'ai_description': f'Detected {len(hands_data)} hand(s) with {len(gestures)} gesture(s).',
                'technical_summary': f'Hand detection completed with {len(hands_data)} hands and {len(gestures)} gestures.'
            }

        except Exception as e:
            return {
                'landmarks': [],
                'ai_description': f'Error processing image: {str(e)}',
                'technical_summary': f'Processing failed: {str(e)}'
            }