from app.utils.db_utils import *
from flask import jsonify
from app.utils.censorship import censorship


def upd_post_likeCount(post_id, user_id):
    conn = create_connection()
    cursor = conn.cursor()
    '''
    cursor.execute("""
    UPDATE posts SET like_count = like_count + 1 WHERE id = %s RETURNING like_count
    """, (post_id,))
    '''
    cursor.execute("""
    SELECT is_like
    FROM post_likes
    WHERE post_id = %s AND user_id = %s
    """, (post_id, user_id))
    result = cursor.fetchone()

    if result is None:
        cursor.execute("""
        INSERT INTO post_likes (post_id, user_id, is_like)
        VALUES (%s, %s, %s)
        """, (post_id, user_id, True))
    elif result[0] == True:
        cursor.execute("""
        DELETE FROM post_likes
        WHERE post_id = %s AND user_id = %s
        """, (post_id, user_id))
    else:
        cursor.execute("""
        UPDATE post_likes
        SET is_like = TRUE
        WHERE post_id = %s AND user_id = %s
        """, (post_id, user_id))

    cursor.execute("""
    SELECT COUNT(*)
    FROM post_likes 
    WHERE is_like = true AND post_id = %s;
    """, (post_id, ))
    new_like_count = cursor.fetchone()[0]

    cursor.execute("""
    SELECT COUNT(*)
    FROM post_likes 
    WHERE is_like = false AND post_id = %s;
    """, (post_id, ))
    new_dislike_count = cursor.fetchone()[0]

    

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({
        'like_count': new_like_count,
        'dislike_count': new_dislike_count,
    })

def upd_post_dislikeCount(post_id, user_id):
    conn = create_connection()
    cursor = conn.cursor()
    '''
    cursor.execute("""
    UPDATE posts SET like_count = like_count + 1 WHERE id = %s RETURNING like_count
    """, (post_id,))
    '''
    cursor.execute("""
    SELECT is_like
    FROM post_likes
    WHERE post_id = %s AND user_id = %s
    """, (post_id, user_id))
    result = cursor.fetchone()

    if result is None:
        cursor.execute("""
        INSERT INTO post_likes (post_id, user_id, is_like)
        VALUES (%s, %s, %s)
        """, (post_id, user_id, False))
    elif result[0] == False:
        cursor.execute("""
        DELETE FROM post_likes
        WHERE post_id = %s AND user_id = %s
        """, (post_id, user_id))
    else:
        cursor.execute("""
        UPDATE post_likes
        SET is_like = FALSE
        WHERE post_id = %s AND user_id = %s
        """, (post_id, user_id))

    cursor.execute("""
    SELECT COUNT(*)
    FROM post_likes 
    WHERE is_like = false AND post_id = %s;
    """, (post_id, ))
    new_dislike_count = cursor.fetchone()[0]

    cursor.execute("""
    SELECT COUNT(*)
    FROM post_likes 
    WHERE is_like = true AND post_id = %s;
    """, (post_id, ))
    new_like_count = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({
        'dislike_count': new_dislike_count,
        'like_count': new_like_count,
    })

def upd_animal_likeCount(animal_id, user_id):
    conn = create_connection()
    cursor = conn.cursor()

    print("animalid, userid: ", animal_id, user_id)

    cursor.execute("""
    SELECT is_like
    FROM animal_likes
    WHERE animal_id = %s AND user_id = %s
    """, (animal_id, user_id))
    result = cursor.fetchone()

    if result is None:
        cursor.execute("""
        INSERT INTO animal_likes (animal_id, user_id, is_like)
        VALUES (%s, %s, %s)
        """, (animal_id, user_id, True))
    elif result[0] == True:
        print("is hereeee!!!!!!!!1!!!!!!")
        cursor.execute("""
        DELETE FROM animal_likes
        WHERE animal_id = %s AND user_id = %s
        """, (animal_id, user_id))
    else:
        cursor.execute("""
        UPDATE animal_likes
        SET is_like = TRUE
        WHERE animal_id = %s AND user_id = %s
        """, (animal_id, user_id))

    cursor.execute("""
    SELECT COUNT(*)
    FROM animal_likes 
    WHERE is_like = true AND animal_id = %s;
    """, (animal_id, ))
    new_like_count = cursor.fetchone()[0]

    cursor.execute("""
    SELECT COUNT(*)
    FROM animal_likes 
    WHERE is_like = false AND animal_id = %s;
    """, (animal_id, ))
    new_dislike_count = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({
        'like_count': new_like_count,
        'dislike_count': new_dislike_count,
    })


def upd_animal_dislikeCount(animal_id, user_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT is_like
    FROM animal_likes
    WHERE animal_id = %s AND user_id = %s
    """, (animal_id, user_id))
    result = cursor.fetchone()

    if result is None:
        cursor.execute("""
        INSERT INTO animal_likes (animal_id, user_id, is_like)
        VALUES (%s, %s, %s)
        """, (animal_id, user_id, False))
    elif result[0] == False:
        cursor.execute("""
        DELETE FROM animal_likes
        WHERE animal_id = %s AND user_id = %s
        """, (animal_id, user_id))
    else:
        cursor.execute("""
        UPDATE animal_likes
        SET is_like = FALSE
        WHERE animal_id = %s AND user_id = %s
        """, (animal_id, user_id))

    cursor.execute("""
    SELECT COUNT(*)
    FROM animal_likes 
    WHERE is_like = false AND animal_id = %s;
    """, (animal_id, ))
    new_dislike_count = cursor.fetchone()[0]

    cursor.execute("""
    SELECT COUNT(*)
    FROM animal_likes 
    WHERE is_like = true AND animal_id = %s;
    """, (animal_id, ))
    new_like_count = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({
        'dislike_count': new_dislike_count,
        'like_count': new_like_count,
    })

def upd_user(user):
    conn = create_connection()
    cursor = conn.cursor()

    user_id = user.get('user_id')
    image = user.get('image')
    user_name = user.get('user_name')
    user_mail = user.get('user_mail')
    university_id = user.get('university_id')

    cursor.execute("""
        UPDATE users 
        SET name = %s,
            mail = %s,
            profile_photo = %s,
            university_id = %s
        WHERE id = %s
    """, (censorship(user_name), user_mail, image, university_id, user_id))
      
    conn.commit()
    cursor.close()
    conn.close()

    jsonify({'status': 200})