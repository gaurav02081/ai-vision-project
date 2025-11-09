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
            # Get image dimensions first
            import cv2
            img = cv2.imread(image_path)
            if img is not None:
                img_height, img_width = img.shape[:2]
                print(f"Original image dimensions: {img_width}x{img_height}")
            else:
                print(f"Could not read image: {image_path}")
                return []
            
            # Use NMS (Non-Maximum Suppression) to filter overlapping detections
            results = self.model(image_path, conf=confidence_threshold, iou=0.5)
            detections = []
            for res in results:
                boxes = getattr(res, 'boxes', [])
                print(f"Found {len(boxes)} boxes in result")
                
                # Check if result has orig_shape attribute
                if hasattr(res, 'orig_shape'):
                    orig_shape = res.orig_shape
                    print(f"YOLO orig_shape: {orig_shape}")
                if hasattr(res, 'shape'):
                    shape = res.shape
                    print(f"YOLO shape: {shape}")
                for i, box in enumerate(boxes):
                    try:
                        cls = int(box.cls)
                        conf = float(box.conf)
                        print(f"Box {i}: cls={cls}, conf={conf}")
                        
                        # Extract bounding box coordinates - try multiple approaches
                        xyxy = None
                        
                        # Try using YOLO's built-in coordinate handling
                        try:
                            # Use the box's built-in methods to get coordinates
                            if hasattr(box, 'xyxy'):
                                xyxy_tensor = box.xyxy
                                if hasattr(xyxy_tensor, 'cpu'):
                                    xyxy_tensor = xyxy_tensor.cpu()
                                if hasattr(xyxy_tensor, 'numpy'):
                                    xyxy_tensor = xyxy_tensor.numpy()
                                xyxy = xyxy_tensor.tolist() if hasattr(xyxy_tensor, 'tolist') else list(xyxy_tensor)
                                
                                # Handle nested lists
                                if isinstance(xyxy, list) and len(xyxy) > 0 and isinstance(xyxy[0], list):
                                    xyxy = xyxy[0]
                                
                                print(f"Built-in xyxy: {xyxy}")
                        except Exception as e:
                            print(f"Error with built-in xyxy: {e}")
                        
                        # Fallback to manual extraction
                        if not xyxy and hasattr(box, 'xyxy'):
                            xy = box.xyxy
                            print(f"Raw xyxy: {xy}, type: {type(xy)}")
                            
                            # Convert to list
                            if hasattr(xy, 'cpu'):  # PyTorch tensor
                                xy = xy.cpu()
                            if hasattr(xy, 'numpy'):  # Convert to numpy
                                xy = xy.numpy()
                            if hasattr(xy, 'tolist'):  # Convert to list
                                xyxy = xy.tolist()
                            else:
                                xyxy = list(xy)
                            
                            # Handle nested lists/tensors
                            if isinstance(xyxy, list) and len(xyxy) > 0:
                                if isinstance(xyxy[0], list):
                                    xyxy = xyxy[0]  # Take first element if nested
                            
                            print(f"Processed bbox from xyxy: {xyxy}")
                            
                            # The coordinates might be in the wrong scale
                            # Let's try to normalize them if they seem too large
                            if len(xyxy) >= 4:
                                x1, y1, x2, y2 = xyxy[:4]
                                
                                # If coordinates are larger than image, they might be in a different scale
                                if x2 > img_width or y2 > img_height:
                                    print(f"Coordinates seem too large, trying to normalize...")
                                    # Try dividing by a common YOLO input size (640)
                                    if x2 > 640 or y2 > 640:
                                        scale_factor = 640.0
                                        xyxy = [x1/scale_factor * img_width, y1/scale_factor * img_height,
                                               x2/scale_factor * img_width, y2/scale_factor * img_height]
                                        print(f"Normalized bbox: {xyxy}")
                                else:
                                    print(f"Coordinates seem reasonable for image size")
                        
                        # Alternative: try xywh format and convert
                        elif hasattr(box, 'xywh'):
                            xywh = box.xywh
                            print(f"Raw xywh: {xywh}, type: {type(xywh)}")
                            
                            # Convert xywh to xyxy
                            if hasattr(xywh, 'cpu'):
                                xywh = xywh.cpu()
                            if hasattr(xywh, 'numpy'):
                                xywh = xywh.numpy()
                            if hasattr(xywh, 'tolist'):
                                xywh = xywh.tolist()
                            
                            if isinstance(xywh, list) and len(xywh) >= 4:
                                if isinstance(xywh[0], list):
                                    xywh = xywh[0]
                                
                                x, y, w, h = xywh[:4]
                                x1, y1 = x - w/2, y - h/2
                                x2, y2 = x + w/2, y + h/2
                                xyxy = [x1, y1, x2, y2]
                                print(f"Converted xywh to xyxy: {xyxy}")
                        
                        if not xyxy:
                            print(f"No valid bbox found for box {i}")
                            continue
                            
                        if xyxy and len(xyxy) >= 4:
                            # Filter out low confidence detections
                            if conf < confidence_threshold:
                                print(f"Skipping low confidence detection: {conf:.3f} < {confidence_threshold}")
                                continue
                            
                            # Filter out extremely large bounding boxes (likely false positives)
                            x1, y1, x2, y2 = xyxy[:4]
                            box_width = x2 - x1
                            box_height = y2 - y1
                            box_area = box_width * box_height
                            image_area = img_width * img_height
                            
                            # Skip boxes that are extremely large (more than 95% of image) - only filter truly problematic detections
                            if box_area > image_area * 0.95:
                                print(f"Skipping extremely oversized box: {box_area:.0f} pixels (>{image_area * 0.95:.0f})")
                                continue
                            
                            # Skip boxes that are extremely wide or tall (more than 95% of image dimensions)
                            if box_width > img_width * 0.95 or box_height > img_height * 0.95:
                                print(f"Skipping extremely oversized box: {box_width:.0f}x{box_height:.0f} (>{img_width * 0.95:.0f}x{img_height * 0.95:.0f})")
                                continue
                            
                            # Get class name from model
                            class_name = "unknown"
                            if self.model and hasattr(self.model, 'names'):
                                class_name = self.model.names.get(cls, f"class_{cls}")
                            
                            detections.append({
                                'class_id': cls,
                                'class': class_name,
                                'confidence': conf,
                                'bbox': xyxy
                            })
                            print(f"Added detection: {cls} with bbox {xyxy}")
                        else:
                            print(f"Invalid bbox format: {xyxy}")
                    except Exception as e:
                        print(f"Error processing box {i}: {e}")
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
                print(f"Could not read image: {image_path}")
                return detections, None
            
            print(f"Image loaded: shape={img.shape}, dtype={img.dtype}")

            # draw boxes
            print(f"Drawing {len(detections)} detections")
            for i, d in enumerate(detections):
                try:
                    bbox = d.get('bbox', [])
                    conf = d.get('confidence', 0)
                    cls_id = d.get('class_id', 0)
                    print(f"Detection {i}: bbox={bbox}, conf={conf}, cls_id={cls_id}")
                    
                    if bbox and len(bbox) >= 4:
                        x1, y1, x2, y2 = map(int, bbox[:4])
                        print(f"Drawing box: ({x1}, {y1}) to ({x2}, {y2})")
                        
                        # Ensure coordinates are within image bounds
                        img_height, img_width = img.shape[:2]
                        x1 = max(0, min(x1, img_width - 1))
                        y1 = max(0, min(y1, img_height - 1))
                        x2 = max(x1 + 1, min(x2, img_width))
                        y2 = max(y1 + 1, min(y2, img_height))
                        
                        print(f"Clamped coordinates: ({x1}, {y1}) to ({x2}, {y2}) for image {img_width}x{img_height}")
                        
                        if x2 > x1 and y2 > y1:
                            color = (0, 255, 0)
                            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                            
                            # Get class name from model
                            class_name = "unknown"
                            if self.model and hasattr(self.model, 'names'):
                                class_name = self.model.names.get(cls_id, f"class_{cls_id}")
                            
                            label = f"{class_name}:{conf:.2f}"
                            cv2.putText(img, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                        else:
                            print(f"Invalid coordinates after clamping: ({x1}, {y1}) to ({x2}, {y2})")
                    else:
                        print(f"Invalid bbox: {bbox}")
                except Exception as e:
                    print(f"Error drawing box: {e}")
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
            
            print(f"Saving visualization to: {out_path}")
            success = cv2.imwrite(out_path, img)
            print(f"Image save success: {success}")
            
            vis_path = os.path.join(rel_dir, out_name)
            print(f"Relative vis_path: {vis_path}")
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
