import os
import torch
from ultralytics import YOLO


class ObjectDetectionService:
    def __init__(self):
        self.model = None
        try:
            # Set torch.load to use weights_only=False to avoid the PyTorch 2.6+ issue
            import torch
            original_load = torch.load
            
            def safe_load(*args, **kwargs):
                kwargs['weights_only'] = False
                return original_load(*args, **kwargs)
            
            torch.load = safe_load
            
            # Load YOLO model
            self.model = YOLO('yolov8n.pt')
            print('YOLO model loaded successfully')
            
            # Restore original torch.load
            torch.load = original_load
            
        except Exception as e:
            print('YOLO model load error:', e)
            self.model = None

    def process_image(self, image_path, confidence_threshold=0.5):
        """Run detection and return a list of detections.

        Each detection: { class_id, confidence, bbox:[x1,y1,x2,y2] }
        """
        if not self.model:
            return []
        try:
            results = self.model(image_path, conf=confidence_threshold)
            detections = []
            for res in results:
                boxes = getattr(res, 'boxes', [])
                for box in boxes:
                    try:
                        cls = int(box.cls)
                        conf = float(box.conf)
                        # box.xyxy may be a tensor with shape (N,4)
                        xyxy = None
                        if hasattr(box, 'xyxy'):
                            xy = box.xyxy
                            # xy may be tensor with first dim batch; try to coerce to list
                            try:
                                xyxy = xy[0].tolist()
                            except Exception:
                                try:
                                    xyxy = xy.tolist()
                                except Exception:
                                    xyxy = []
                        detections.append({
                            'class_id': cls,
                            'confidence': conf,
                            'bbox': xyxy
                        })
                    except Exception:
                        continue
            return detections
        except Exception as e:
            print('Error during detection:', e)
            return []

    def process_image_with_viz(self, image_path, confidence_threshold=0.5):
        """Run detection, save a visualization image under MEDIA_ROOT/results/,
        and return (detections, relative_result_file_path or None).
        """
        detections = self.process_image(image_path, confidence_threshold=confidence_threshold)
        vis_path = None
        try:
            import cv2
            # import Django settings properly
            from django.conf import settings
            # read image
            img = cv2.imread(image_path)
            if img is None:
                return detections, None

            # draw boxes
            for d in detections:
                try:
                    bbox = d.get('bbox', [])
                    conf = d.get('confidence', 0)
                    cls = d.get('class_id', 0)
                    if bbox and len(bbox) >= 4:
                        x1, y1, x2, y2 = map(int, bbox[:4])
                        color = (0, 255, 0)
                        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                        label = f"{cls}:{conf:.2f}"
                        cv2.putText(img, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                except Exception:
                    continue

            # prepare output path
            rel_dir = os.path.join('results', 'detection')
            media_root = getattr(settings, 'MEDIA_ROOT', None)
            if not media_root:
                media_root = os.path.join(os.getcwd(), 'media')
            out_dir = os.path.join(media_root, rel_dir)
            os.makedirs(out_dir, exist_ok=True)
            base = os.path.basename(image_path)
            name, ext = os.path.splitext(base)
            out_name = f"{name}_vis{ext}"
            out_path = os.path.join(out_dir, out_name)
            cv2.imwrite(out_path, img)
            vis_path = os.path.join(rel_dir, out_name)
        except Exception as e:
            print('Could not create visualization:', e)
            vis_path = None

        return detections, vis_path

    def process_video(self, video_path, confidence_threshold=0.5):
        """Process video and return detections for each frame.
        
        Returns: List of frame detections with frame numbers
        """
        if not self.model:
            return []
        
        try:
            import cv2
            
            # Open video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"Error: Could not open video {video_path}")
                return []
            
            frame_detections = []
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Save frame temporarily
                temp_frame_path = f"/tmp/frame_{frame_count}.jpg"
                cv2.imwrite(temp_frame_path, frame)
                
                # Process frame
                detections = self.process_image(temp_frame_path, confidence_threshold)
                frame_detections.append({
                    'frame': frame_count,
                    'detections': detections
                })
                
                # Clean up temp file
                import os
                if os.path.exists(temp_frame_path):
                    os.remove(temp_frame_path)
                
                frame_count += 1
                
                # Limit to first 30 frames for demo purposes
                if frame_count >= 30:
                    break
            
            cap.release()
            return frame_detections
            
        except Exception as e:
            print(f'Error during video processing: {e}')
            return []

    def process_video_with_viz(self, video_path, confidence_threshold=0.5):
        """Process video and create output video with detections.
        
        Returns: (frame_detections, output_video_path)
        """
        if not self.model:
            return [], None
        
        try:
            import cv2
            from django.conf import settings
            
            # Open input video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"Error: Could not open video {video_path}")
                return [], None
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Prepare output path
            rel_dir = os.path.join('results', 'detection')
            media_root = getattr(settings, 'MEDIA_ROOT', None)
            if not media_root:
                media_root = os.path.join(os.getcwd(), 'media')
            out_dir = os.path.join(media_root, rel_dir)
            os.makedirs(out_dir, exist_ok=True)
            
            base = os.path.basename(video_path)
            name, ext = os.path.splitext(base)
            out_name = f"{name}_vis.mp4"
            out_path = os.path.join(out_dir, out_name)
            
            # Setup video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
            
            frame_detections = []
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame for detections
                temp_frame_path = f"/tmp/frame_{frame_count}.jpg"
                cv2.imwrite(temp_frame_path, frame)
                detections = self.process_image(temp_frame_path, confidence_threshold)
                
                # Draw detections on frame
                for detection in detections:
                    bbox = detection.get('bbox', [])
                    conf = detection.get('confidence', 0)
                    cls = detection.get('class_id', 0)
                    
                    if bbox and len(bbox) >= 4:
                        x1, y1, x2, y2 = map(int, bbox[:4])
                        color = (0, 255, 0)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        label = f"{cls}:{conf:.2f}"
                        cv2.putText(frame, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
                # Write frame to output video
                out.write(frame)
                
                frame_detections.append({
                    'frame': frame_count,
                    'detections': detections
                })
                
                # Clean up temp file
                if os.path.exists(temp_frame_path):
                    os.remove(temp_frame_path)
                
                frame_count += 1
                
                # Limit to first 30 frames for demo purposes
                if frame_count >= 30:
                    break
            
            cap.release()
            out.release()
            
            # Return relative path
            vis_path = os.path.join(rel_dir, out_name)
            return frame_detections, vis_path
            
        except Exception as e:
            print(f'Error during video processing with visualization: {e}')
            return [], None
