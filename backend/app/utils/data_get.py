from app.utils.db_utils import *
from flask import jsonify

def get_animals(searchName = None, animalId = None, universityId = None, goodyAlgorithm = None, userId = None):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        a.id,
        a.name,
        a.kind,
        a.profile_photo,
        (
            SELECT COUNT(*)
            FROM animal_likes
            WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true
        ) AS like_count,
        (
            SELECT COUNT(*)
            FROM animal_likes
            WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = false
        ) AS dislike_count,
        universities.name,
        universities.abbreviation,
        (
            CASE
                WHEN (SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true) = 0 
                    AND (SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = false) = 0 THEN 0
                ELSE CAST((SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true) AS FLOAT) / 
                    ((SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = false) + 
                    (SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true))
            END
        ) AS goody_score,
        universities.id

    FROM animals a
    LEFT JOIN universities ON universities.id = a.university_id
    LEFT JOIN users ON users.id = a.id
    WHERE 1=1
    """
    
    parameters = []

    if(searchName): 
        query += " AND (LOWER(a.name) LIKE LOWER(%s))"
        parameters.append('%' + searchName + '%')
    if(animalId): 
        query += " AND (a.id = %s)"
        parameters.append(animalId)
    if(universityId): 
        query += " AND (universities.id = %s)"
        parameters.append(universityId)
    if(goodyAlgorithm):
        query += """ AND (
            (SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true) = 0 AND 
            (SELECT COUNT(*) FROM animal_likes WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = false) = 0
        ) IS NOT TRUE
        """
    if(userId): 
        query += " AND (a.added_by = %s)"
        parameters.append(userId)

    query += """
    ORDER BY goody_score DESC;
    """
    #     LIMIT 5;

    cursor.execute(query,  parameters)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    animals = []
    for row in rows:
        animal = {
            'id': row[0],
            'name': row[1],
            'kind': row[2],
            'profile_photo': row[3],
            'like_count': row[4],
            'dislike_count': row[5],
            'university_name': row[6],
            'university_abbreviation': row[7],
            'goody_score': row[8],
            'university_id': row[9]
        }
        if animalId:
            posts = get_animals_posts(animalId)
            animal['posts'] = posts
        if animalId:
            comments = get_animals_comments(animalId)
            animal['comments'] = comments
        
        animals.append(animal)

    return jsonify(animals)

def get_animals_posts(animalId):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        a.id,
        pa.post_id,
        p.user_id,
        u.name,
        u.profile_photo,
        p.image,
        p.description,
        p.posted_date,
        (
            SELECT COUNT(*)
            FROM animal_likes
            WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = true
        ) AS like_count,
        (
            SELECT COUNT(*)
            FROM animal_likes
            WHERE animal_likes.animal_id = a.id AND animal_likes.is_like = false
        ) AS dislike_count
    FROM animals a
    LEFT JOIN post_animals pa ON a.id = pa.animal_id
    RIGHT JOIN posts p ON p.id = pa.post_id
    LEFT JOIN users u ON u.id = p.user_id
    WHERE a.id = %s
    ORDER BY p.posted_date DESC;
    """

    cursor.execute(query,  (animalId,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    posts = []
    if(len(rows) != 0):
        for row in rows:
            posts.append({
                'animal_id': row[0],
                'post_id': row[1],
                'user_id': row[2],
                'user_name': row[3],
                'user_profilePhoto': row[4],
                'image': row[5],
                'description': row[6],
                'postedDate': row[7],
                'likeCount': row[8],
                'dislikeCount': row[9]
            })

    return posts

def get_animals_comments(animalId):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        comments_animal.animal_id,
        comments_animal.user_id,
        users.name,
        users.profile_photo,
        comments_animal.comment
    FROM animals
    LEFT JOIN comments_animal ON animals.id = comments_animal.animal_id
    LEFT JOIN users ON comments_animal.user_id = users.id
    WHERE animals.id = %s
    ORDER BY comments_animal.added_date DESC;

    """

    cursor.execute(query,  (animalId,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    comments = []
    if(len(rows) != 0):
        for row in rows:
            comments.append({
                'animal_id': row[0],  
                'user_id': row[1],
                'user_name': row[2],
                'user_photo': row[3],
                'comment': row[4],
            })

    return comments


def get_latest_posts():
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        posts.id,
        users.id,
        users.name,
        users.profile_photo,
        posts.image,
        posts.description,
        posts.posted_date,
        (
            SELECT COUNT(*)
            FROM post_likes
            WHERE post_likes.post_id = posts.id AND post_likes.is_like = true
        ) AS like_count,
        (
            SELECT COUNT(*)
            FROM post_likes
            WHERE post_likes.post_id = posts.id AND post_likes.is_like = false
        ) AS dislike_count,
        COUNT(comments_post.id) AS comment_count

    FROM posts
    LEFT JOIN users ON users.id = posts.user_id
    LEFT JOIN comments_post ON comments_post.post_id = posts.id
    GROUP BY
        posts.id, users.id, users.name, users.profile_photo,
        posts.image, posts.description, posts.posted_date
    ORDER BY posts.posted_date DESC
    LIMIT 150;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    latest_post = []
    for row in rows:
        a_post = {
            'id': row[0],
            'user_id': row[1],
            'user_name': row[2],
            'user_profilePhoto': row[3],
            'image': row[4],
            'description': row[5],
            'postedDate': row[6],
            'likeCount': row[7],
            'dislikeCount': row[8],
            'commentCount': row[9],
            'postsAnimal': []
        }

        conn = create_connection()
        cursor = conn.cursor()

        cursor.execute("""
        SELECT
            post_animals.animal_id,
            animals.name,
            animals.profile_photo
        FROM post_animals
        LEFT JOIN animals ON animals.id = post_animals.animal_id
        WHERE post_id = %s;
        """, (row[0], ))

        post_animals = cursor.fetchall()
        cursor.close()
        conn.close()

        for animal in post_animals:
            animals_info = {
                'id': animal[0],
                'name': animal[1],
                'profile_photo': animal[2]
            }
            a_post['postsAnimal'].append(animals_info) 


        latest_post.append(a_post)

    return jsonify(latest_post)

def get_user_info(user_id):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        users.id,
        users.name,
        users.profile_photo,
        (
            SELECT COUNT(*)
            FROM follower_table
            WHERE user_id = %s
        ) AS following_count,
        (
            SELECT COUNT(*)
            FROM follower_table
            WHERE follows = %s
        ) AS follower_count,
        (
            SELECT COUNT(*)
            FROM posts
            WHERE user_id = %s
        ) AS post_count,
        users.mail,
        universities.name,
        universities.id
    FROM users
    LEFT JOIN universities ON universities.id = users.university_id
    WHERE users.id = %s;
    """

    cursor.execute(query, (user_id, user_id, user_id, user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT follower_table.user_id
    FROM follower_table
    WHERE follower_table.follows = %s;
    """

    cursor.execute(query, (user_id,))
    followers = cursor.fetchall()
    cursor.close()
    conn.close()

    user_info = []
    for row in rows:
        user_info_ = {
            'user_id': row[0],
            'user_name': row[1],
            'user_profile_photo': row[2],
            'user_following_count': row[3],
            'user_follower_count': row[4],
            'user_post_count': row[5],
            'user_mail': row[6],
            'user_university': row[7],
            'user_university_id': row[8],
            'followers': [follower[0] for follower in followers]  # Add followers
        }
        user_info.append(user_info_)

    return jsonify(user_info)

def get_user_posts(user_id):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        posts.*,
        (
            SELECT COUNT(*)
            FROM post_likes
            WHERE post_likes.post_id = posts.id AND post_likes.is_like = true
        ) AS like_count,
        (
            SELECT COUNT(*)
            FROM post_likes
            WHERE post_likes.post_id = posts.id AND post_likes.is_like = false
        ) AS dislike_count
    FROM posts
    WHERE user_id = %s
    ORDER BY posted_date DESC;
    """

    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    user_posts = []

    for row in rows:
        user_posts.append({
            'post_id': row[0],
            'post_user_id': row[1],
            'post_image': row[2],
            'post_description': row[3],
            'post_posted_date': row[4],
            'post_like_count': row[5],
            'post_dislike_count': row[6],
        })
    
    return jsonify(user_posts)

def get_universities(searchName = None, uniId = None):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        u.id,
        u.name,
        u.abbreviation,
        u.photo
    FROM universities u
    WHERE 1=1
    """
    
    parameters = []

    if(searchName): 
        query += "AND (LOWER(u.name) LIKE LOWER(%s) OR LOWEr(u.abbreviation) LIKE LOWER(%s))"
        parameters.append('%' + searchName + '%')
        parameters.append('%' + searchName + '%')
    if(uniId): 
        query += "AND (u.id = %s)"
        parameters.append(uniId)
        

    cursor.execute(query,  parameters)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    universities = []
    for row in rows:
        universities.append({
            'id': row[0],
            'name': row[1],
            'abbreviation': row[2],
            'photo': row[3]
        })
    
    return jsonify(universities)

def get_comments(post_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        comments_post.id,
        comments_post.post_id,
        comments_post.user_id,
        comments_post.comment,
        comments_post.added_date,
        comments_post.like_count,
        comments_post.dislike_count,
        users.name,
        users.profile_photo
    FROM comments_post
    LEFT JOIN users ON users.id = comments_post.user_id
    WHERE comments_post.post_id = %s
    ORDER BY comments_post.added_date DESC;
    """, (post_id,))

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    comments = []
    for row in rows:
        comments.append({
            'id': row[0],
            'post_id': row[1],
            'user_id': row[2],
            'comment': row[3],
            'added_date': row[4],
            'like_count': row[5],
            'dislike_count': row[6],
            'user_name': row[7],
            'user_profile_photo': row[8]
        })
    
    return jsonify(comments)

def get_profiles(searchName = None, uniId = None):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        users.id,
        users.name,
        users.mail,
        users.profile_photo
    FROM users
    WHERE 1=1
    """

    parameters = []
    if(searchName): 
        query += "AND (LOWER(users.name) LIKE LOWER(%s))"
        parameters.append('%' + searchName + '%')
    if(uniId): 
        query += "AND (users.university_id = %s)"
        parameters.append(uniId)

    query += "ORDER BY users.profile_photo ASC;"

    cursor.execute(query,  parameters)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    profiles = []
    for row in rows:
        profiles.append({
            'id': row[0],
            'name': row[1],
            'mail': row[2],
            'profile_photo': row[3]
        })
    
    return jsonify(profiles)

def get_publicRooms(room_name = None):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        rooms.id,
        rooms.constructor_id,
        rooms.is_public,
        rooms.room_photo,
        rooms.room_name
    FROM rooms
    WHERE rooms.is_public = true
    """

    parameters = []
    if(room_name):
        query += " AND LOWER(rooms.room_name) LIKE LOWER(%s)"
        parameters.append("%" + room_name + "%")

    query += ";"

    if parameters:
        cursor.execute(query, parameters)
    else:
        cursor.execute(query)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    publicRooms = []
    for row in rows:
        publicRooms.append({
            'id': row[0],
            'constructor_id': row[1],
            'is_public': row[2],
            'room_photo': row[3],
            'room_name': row[4]
        })

    return jsonify(publicRooms)

def get_secretRooms(user_id, room_name = None):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT DISTINCT
        rooms.id,
        rooms.constructor_id,
        rooms.is_public,
        rooms.room_photo,
        rooms.room_name
    FROM rooms
    WHERE rooms.is_public = false AND rooms.constructor_id = %s

    UNION

    SELECT DISTINCT
        rooms.id,
        rooms.constructor_id,
        rooms.is_public,
        rooms.room_photo,
        rooms.room_name
    FROM rooms
    INNER JOIN participants ON rooms.id = participants.room_id
    WHERE rooms.is_public = false AND participants.user_id = %s;
    """

    parameters = []
    parameters.append(user_id)
    parameters.append(user_id)

    if(room_name):
        query += " AND (LOWER(rooms.room_name) LIKE LOWER(%s))"
        parameters.append("%" + room_name + "%")

    query += ";"

    cursor.execute(query, (parameters))

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    secretRooms = []
    for row in rows:
        secretRooms.append({
            'id': row[0],
            'constructor_id': row[1],
            'is_public': row[2],
            'room_photo': row[3],
            'room_name': row[4]
        })

    return jsonify(secretRooms)

def get_roomInfos(room_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        messages.user_id,
        users.name,
        users.profile_photo,
        messages.message,
        messages.date
    FROM rooms
    LEFT JOIN messages ON messages.room_id = rooms.id
    LEFT JOIN users ON  users.id = messages.user_id
    WHERE rooms.id = %s
    ORDER BY messages.date ASC;
    """, (room_id,))

    messages = cursor.fetchall()
    cursor.close()
    conn.close()

    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        users.id,
        users.name,
        users.profile_photo
    FROM rooms
    LEFT JOIN participants ON participants.room_id = rooms.id
    LEFT JOIN users ON users.id = participants.user_id
    WHERE rooms.id = %s;
    """, (room_id,))

    participantsInfos = cursor.fetchall()
    cursor.close()
    conn.close()

    room_info = {
        'messages': [
            {
                'user_id': str(msg[0]),  # Convert to string since user_id might be an integer
                'user_name': msg[1],
                'user_profile_photo': msg[2],
                'message': msg[3],
                'date': msg[4].isoformat() if msg[4] else None  # Handle date formatting
            } for msg in messages
        ],
        'participants': [
            {
                'user_id': str(participant[0]),  # Convert to string
                'user_name': participant[1],
                'user_profile_photo': participant[2]
            } for participant in participantsInfos
        ]
    }

    return jsonify(room_info)  # Add return statement

def get_user_posts_like(user_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        post_likes.post_id,
        post_likes.is_like
    FROM post_likes
    WHERE post_likes.user_id = %s;
    """, (user_id,))

    rows = cursor.fetchall()

    user_posts_like = []
    for row in rows:
        user_posts_like.append({
            'post_id': row[0],
            'is_like': row[1]
        })
    
    return jsonify(user_posts_like)

def get_user_animals_like(user_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        animal_likes.animal_id,
        animal_likes.is_like
    FROM animal_likes
    WHERE animal_likes.user_id = %s;
    """, (user_id,))

    rows = cursor.fetchall()

    user_animals_like = []
    for row in rows:
        user_animals_like.append({
            'animal_id': row[0],
            'is_like': row[1]
        })
    
    return jsonify(user_animals_like)

def get_follower_table(user_id):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        follower_table.follows AS followings,
        users.name,
        users.profile_photo
    FROM follower_table
    LEFT JOIN users ON users.id = follower_table.follows
    WHERE user_id = %s;
    """

    cursor.execute(query, (user_id,))
    followings = cursor.fetchall()

    query = """
    SELECT
        follower_table.user_id AS followers,
        users.name,
        users.profile_photo
    FROM follower_table
    LEFT JOIN users ON users.id = follower_table.user_id
    WHERE follows = %s;
    """

    cursor.execute(query, (user_id,))
    followers = cursor.fetchall()

    cursor.close()
    conn.close()

    
    follow_info = []

    user_followers = []
    for follower in followers:
        user_info_ = {
            'id': follower[0],
            'name': follower[1],
            'profile_photo': follower[2]
        }
        user_followers.append(user_info_)
    follow_info.append(user_followers)

    user_followings = []
    for following in followings:
        user_info_ = {
            'id': following[0],
            'name': following[1],
            'profile_photo': following[2]
        }
        user_followings.append(user_info_)
    follow_info.append(user_followings)

    return jsonify(follow_info)

def get_last10AnimalPoint(animal_id):
    conn = create_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        latitude,
        longitude,
        timestamp
    FROM animal_points
    WHERE animal_id = %s
    ORDER BY timestamp DESC
    LIMIT 10;
    """, (animal_id,))

    points = cursor.fetchall()

    cursor.close()
    conn.close()

    formatted_points = []
    for point in points:
        formatted_points.append({
            'latitude': point[0],
            'longitude': point[1],
            'timestamp': point[2].isoformat() if point[2] else None  # Format timestamp as ISO string
        })

    return jsonify(formatted_points)
    