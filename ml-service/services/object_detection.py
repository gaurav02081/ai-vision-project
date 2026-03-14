import os
import torch
from ultralytics import YOLO


# Standalone media root for the ML service
MEDIA_ROOT = os.environ.get("MEDIA_ROOT", "/app/media")


class ObjectDetectionService:
    def __init__(self):
        self.model = None
        try:
            original_load = torch.load

            def safe_load(*args, **kwargs):
                kwargs['weights_only'] = False
                return original_load(*args, **kwargs)

            torch.load = safe_load
            self.model = YOLO('yolov8n.pt')
            print('YOLO model loaded successfully')
            torch.load = original_load
        except Exception as e:
            print('YOLO model load error:', e)
            self.model = None

    def process_image(self, image_path, confidence_threshold=0.5):
        if not self.model:
            return []
        try:
            import cv2
            img = cv2.imread(image_path)
            if img is None:
                return []
            img_height, img_width = img.shape[:2]

            results = self.model(image_path, conf=confidence_threshold, iou=0.5)
            detections = []
            for res in results:
                boxes = getattr(res, 'boxes', [])
                for box in boxes:
                    try:
                        cls = int(box.cls)
                        conf = float(box.conf)
                        if conf < confidence_threshold:
                            continue

                        xyxy = None
                        if hasattr(box, 'xyxy'):
                            t = box.xyxy
                            if hasattr(t, 'cpu'):
                                t = t.cpu()
                            if hasattr(t, 'numpy'):
                                t = t.numpy()
                            xyxy = t.tolist() if hasattr(t, 'tolist') else list(t)
                            if isinstance(xyxy, list) and len(xyxy) > 0 and isinstance(xyxy[0], list):
                                xyxy = xyxy[0]

                        if not xyxy or len(xyxy) < 4:
                            continue

                        x1, y1, x2, y2 = xyxy[:4]
                        box_area = (x2 - x1) * (y2 - y1)
                        image_area = img_width * img_height
                        if box_area > image_area * 0.95:
                            continue
                        if (x2 - x1) > img_width * 0.95 or (y2 - y1) > img_height * 0.95:
                            continue

                        class_name = "unknown"
                        if self.model and hasattr(self.model, 'names'):
                            class_name = self.model.names.get(cls, f"class_{cls}")

                        detections.append({
                            'class_id': cls,
                            'class': class_name,
                            'confidence': conf,
                            'bbox': xyxy[:4]
                        })
                    except Exception:
                        continue
            return detections
        except Exception as e:
            print('Error during detection:', e)
            return []

    def process_image_with_viz(self, image_path, confidence_threshold=0.5):
        detections = self.process_image(image_path, confidence_threshold=confidence_threshold)
        vis_path = None
        try:
            import cv2
            img = cv2.imread(image_path)
            if img is None:
                return detections, None

            for d in detections:
                bbox = d.get('bbox', [])
                conf = d.get('confidence', 0)
                cls_id = d.get('class_id', 0)
                if bbox and len(bbox) >= 4:
                    x1, y1, x2, y2 = map(int, bbox[:4])
                    img_h, img_w = img.shape[:2]
                    x1 = max(0, min(x1, img_w - 1))
                    y1 = max(0, min(y1, img_h - 1))
                    x2 = max(x1 + 1, min(x2, img_w))
                    y2 = max(y1 + 1, min(y2, img_h))
                    if x2 > x1 and y2 > y1:
                        color = (0, 255, 0)
                        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                        class_name = "unknown"
                        if self.model and hasattr(self.model, 'names'):
                            class_name = self.model.names.get(cls_id, f"class_{cls_id}")
                        label = f"{class_name}:{conf:.2f}"
                        cv2.putText(img, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            rel_dir = os.path.join('results', 'detection')
            out_dir = os.path.join(MEDIA_ROOT, rel_dir)
            os.makedirs(out_dir, exist_ok=True)
            base = os.path.basename(image_path)
            name, ext = os.path.splitext(base)
            out_name = f"{name}_vis{ext}"
            out_path = os.path.join(out_dir, out_name)

            success = cv2.imwrite(out_path, img)
            if success and os.path.exists(out_path):
                vis_path = out_path  # Return absolute path
        except Exception as e:
            print('Could not create visualization:', e)
            vis_path = None

        return detections, vis_path
