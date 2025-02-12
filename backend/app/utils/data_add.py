from app.utils.db_utils import *
from flask import jsonify

def add_newPost(post):
    conn = create_connection()
    cursor = conn.cursor()

    print(post)

    cursor.execute("""
    INSERT INTO posts (user_id, image, description)
    VALUES (%s, %s, %s)
    RETURNING id;
    """, (post['user_id'], post['image'], post['description']))
    post_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    conn = create_connection()
    cursor = conn.cursor()
    for animal_id in post['animal_ids']:
        cursor.execute("""
        INSERT INTO post_animals (post_id, animal_id)
        VALUES (%s, %s);
        """, (post_id, animal_id))
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'status': 200,
                    'post_id': post_id})

def add_newAnimal(animal):
    conn = create_connection()
    cursor = conn.cursor()

    print(animal)

    cursor.execute("""
    INSERT INTO animals (name, kind, added_by, profile_photo, university_id)
    VALUES (%s, %s, %s,%s, %s)
    RETURNING id;
    """, (animal['animal_name'], animal['animal_kind'], animal['user_id'], animal['image'], animal['university_id']))
    animal_id = cursor.fetchone()[0]
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'status': 200,
                    'animal_id': animal_id})


def add_newComment(comment, postId):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO comments_post (post_id, user_id, comment)
    VALUES (%s, %s, %s)
    RETURNING id;
    """, (postId, comment['user_id'], comment['comment']))
    comment_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 200,
                    'comment_id': comment_id})


def add_follow(users):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO follower_table (user_id, follows)
    VALUES (%s, %s);
    """, (users['currentUserId'], users['userId']))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 200})

def send_messageToChat(room_id, user_id, message):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO messages (room_id, user_id, message)
    VALUES (%s, %s, %s);
    """, (room_id, user_id, message))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 200})

def add_newRoom(room):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO rooms (constructor_id, is_public, room_photo, room_name)
    VALUES (%s, %s, %s, %s)
    RETURNING id;
    """, (room['constructor_id'], room['room_type'], room['image'], room['room_name']))
    room_id = cursor.fetchone()[0]
    conn.commit()

    cursor.close()
    conn.close()

    for participant in room['participants']:
        print("room_id:", room_id, "--", "user_id:", participant)
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO participants (room_id, user_id)
        VALUES (%s, %s);
        """, (room_id, participant))
        conn.commit()
        cursor.close()
        conn.close()

    

    return jsonify({'status': 200,
                    'room_id': room_id})