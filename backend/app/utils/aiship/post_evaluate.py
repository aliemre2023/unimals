from app.utils.db_utils import *
import requests
from io import BytesIO
from PIL import Image
import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.aiship.animal_recognizer import re_recognize
from app.utils.aiship.__init__ import *

yolo = torch.hub.load('ultralytics/yolov5', 'custom', path='app/utils/aiship/models/yolov5s.pt')

def animal_detect_base64(image_io):
    conn = create_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # 1) Update outdated animals' embeddings (same as original function)
    update_query = """
    SELECT
        animals.id,
        animals.embedding,
        animals.embedding_at
    FROM animals
    WHERE embedding_at < NOW() - INTERVAL '30 days' OR embedding IS NULL;
    """
    cursor.execute(update_query)
    outdated_animals = cursor.fetchall()

    for animal in outdated_animals:
        print("re recognized animal:", animal["id"])
        re_recognize(animal["id"])

    # 2) Fetch all animals with embeddings (same as original function)
    cursor.execute("SELECT id, name, embedding FROM animals WHERE embedding IS NOT NULL;")
    animals = cursor.fetchall()

    # Prepare DB embeddings and animal IDs/names for matching
    db_embeddings = []
    db_animals = []
    print("--------------------------")
    for a in animals:
        db_embeddings.append(np.array(a['embedding']))
        db_animals.append({'id': a['id'], 'name': a['name']})
    db_embeddings = np.array(db_embeddings)

    # 3) Detect animals in the image using the BytesIO input
    detected_animals = detect_animals_embeddings_in_image(image_io)

    matched_animals = []
    for detected in detected_animals:
        detected_emb = detected['embedding'].reshape(1, -1)

        # Compute cosine similarity against all DB embeddings
        similarities = cosine_similarity(detected_emb, db_embeddings)[0]

        # Get best match index and similarity score
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]

        # Threshold to accept match
        if best_score > 0.7:
            print("matched_animal:", db_animals[best_idx]['name'])
            matched_animals.append({
                "animal_id": db_animals[best_idx]['id'],
                "animal_name": db_animals[best_idx]['name'],
                "similarity": best_score,
                "bbox": detected["bbox"],
                "label": detected["label"],
                "confidence": detected["confidence"],
            })
    
    cursor.close()
    conn.close()

    return set(animal["animal_id"] for animal in matched_animals if animal["animal_id"] is not None)

def detect_animals_embeddings_in_image(image_io):
    try:
        # Load image from BytesIO
        image = Image.open(image_io).convert("RGB")
        img_cv2 = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Run YOLO detection
        results = yolo(image)

        animals_in_post = []

        for *xyxy, conf, cls in results.xyxy[0]:
            label = results.names[int(cls)]
            if label not in ['cat', 'dog']:
                continue  # Skip non-pets

            x1, y1, x2, y2 = map(int, xyxy)
            crop = img_cv2[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            crop_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            crop_tensor = transform(crop_pil).unsqueeze(0)

            with torch.no_grad():
                embedding = resnet(crop_tensor).squeeze().numpy()
                embedding /= np.linalg.norm(embedding)  # Normalize embedding

            animals_in_post.append({
                "embedding": embedding,
                "bbox": (x1, y1, x2, y2),
                "label": label,
                "confidence": float(conf)
            })

        return animals_in_post

    except Exception as e:
        print(f"Error processing post image: {e}")
        return []