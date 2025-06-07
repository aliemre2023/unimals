from app.utils.db_utils import *
import requests
from PIL import Image
from io import BytesIO
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import datetime
from app.utils.aiship.__init__ import *

SIMILARITY_THRESHOLD = 0.7

def get_embedding_from_url(url: str) -> torch.Tensor:
    try:
        response = requests.get(url)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGB")
        img_tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            embedding = resnet(img_tensor).squeeze().numpy()
        return embedding
    except Exception as e:
        print(f"Error processing image from URL {url}: {e}")
        return None

def classify(animal_id = None):
    conn = create_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)


    query = """
    WITH ranked_posts AS (
        SELECT
            a.id AS animal_id,
            a.name,
            a.profile_photo,
            p.image AS post_image,
            p.posted_date,
            ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY p.posted_date DESC) AS rn
        FROM animals a
        LEFT JOIN post_animals pa ON a.id = pa.animal_id
        LEFT JOIN posts p ON pa.post_id = p.id AND p.image IS NOT NULL
        WHERE a.profile_photo IS NOT NULL
    )
    SELECT
        animal_id,
        name,
        profile_photo,
        post_image
    FROM ranked_posts
    WHERE 
    """
    if(animal_id != None):
        query += f" animal_id = {animal_id} AND (rn <= 5 OR rn IS NULL)"
    else:
        query += " rn <= 5 OR rn IS NULL"
    query += ";"

    cursor.execute(query)

    


    animal_rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # Group rows per animal
    animal_dict = {}
    for row in animal_rows:
        animal_id = row["animal_id"]
        if animal_id not in animal_dict:
            animal_dict[animal_id] = {
                "name": row["name"],
                "profile_photo": row["profile_photo"],
                "post_images": []
            }
        animal_dict[animal_id]["post_images"].append(row["post_image"])

    final_embeddings = {}

    for animal_id, data in animal_dict.items():
        profile_embedding = get_embedding_from_url(data["profile_photo"])
        if profile_embedding is None:
            continue

        valid_post_embeddings = []
        for post_image in data["post_images"]:
            post_embedding = get_embedding_from_url(post_image)
            if post_embedding is None:
                continue

            similarity = cosine_similarity(
                [profile_embedding], [post_embedding]
            )[0][0]

            if similarity >= SIMILARITY_THRESHOLD:
                valid_post_embeddings.append(post_embedding)

        # Include profile photo too
        all_embeddings = valid_post_embeddings + [profile_embedding]

        if all_embeddings:
            avg_embedding = np.mean(all_embeddings, axis=0)
            avg_embedding /= np.linalg.norm(avg_embedding)

            final_embeddings[animal_id] = {
                "name": data["name"],
                "embedding": avg_embedding.tolist()
            }

    #print(final_embeddings)
    return final_embeddings



def save_embeddings_to_db(embeddings: dict):
    conn = create_connection()
    cursor = conn.cursor()

    for animal_id, data in embeddings.items():
        #print("animal_id: ", animal_id)
        embedding = data["embedding"]
        cursor.execute(
            """
            UPDATE animals
            SET embedding = %s,
                embedding_at = %s
            WHERE id = %s
            """,
            (embedding, datetime.datetime.now(), animal_id)
        )

    conn.commit()
    cursor.close()
    conn.close()

def re_recognize(animal_id = None):
    final_embeddings = classify(animal_id)
    save_embeddings_to_db(final_embeddings)