from flask import Blueprint, request, jsonify, session, redirect, url_for
from app.utils.data_get import *
from app.utils.data_upd import *
from app.utils.data_del import *
from app.utils.data_add import *

api_bp = Blueprint("api", __name__)

@api_bp.route('/animals', methods=['GET'])
def api_animals():
    animalName = request.args.get('name', '')
    animalId = request.args.get('id', '')
    universityId = request.args.get('university_id', '')
    animals = get_animals(animalName, animalId, universityId)
    return animals

@api_bp.route('/profiles', methods=['GET'])
def api_profiles():
    profileName = request.args.get('name', '')
    universityId = request.args.get('university_id', '')
    profiles = get_profiles(profileName, universityId)
    return profiles

@api_bp.route('/post/latest', methods=['GET'])
def api_latest_post():
    latest_post = get_latest_posts()
    return latest_post

@api_bp.route("/users/<int:user_id>", methods=['GET'])
def api_user_info(user_id):
    user_info = get_user_info(user_id)
    return user_info

@api_bp.route("/users/<int:user_id>/posts", methods=['GET'])
def api_user_posts(user_id):
    user_posts = get_user_posts(user_id)
    return user_posts

@api_bp.route("/users/posts/like", methods=['GET'])
def api_user_liked_posts():
    user_id = request.args.get('user_id')
    print(user_id)
    user_posts_like = get_user_posts_like(user_id)
    return user_posts_like

@api_bp.route("/users/animals/like", methods=['GET'])
def api_user_liked_animals():
    user_id = request.args.get('user_id')
    print(user_id)
    user_animals_like = get_user_animals_like(user_id)
    return user_animals_like

@api_bp.route('/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    data = request.get_json()
    user_id = data.get("user_id")
    like_count = upd_post_likeCount(post_id, user_id)
    return like_count

@api_bp.route('/animals/<int:animal_id>/like', methods=['POST'])
def like_animal(animal_id):
    data = request.get_json()
    user_id = data.get("user_id")
    print(user_id)
    like_count = upd_animal_likeCount(animal_id, user_id)
    return like_count

@api_bp.route('/posts/<int:post_id>/dislike', methods=['POST'])
def dislike_post(post_id):
    data = request.get_json()
    user_id = data.get("user_id")
    print("data: ", data)
    print("userid: ", user_id)
    dislike_count = upd_post_dislikeCount(post_id, user_id)
    return dislike_count

@api_bp.route('/animals/<int:animal_id>/dislike', methods=['POST'])
def dislike_animal(animal_id):
    data = request.get_json()
    user_id = data.get("user_id")
    print("data: ", data)
    print("userid: ", user_id)
    dislike_count = upd_animal_dislikeCount(animal_id, user_id)
    return dislike_count



@api_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    conn = create_connection()
    cursor = conn.cursor()

    # alread registered
    cursor.execute("SELECT id FROM users WHERE name = %s OR mail = %s", (username, email))
    existing_user = cursor.fetchone()
    if existing_user:
        cursor.close()
        conn.close()
        return jsonify({"error": "Username or email already exists"}), 409
        
    # insert
    cursor.execute("""
        INSERT INTO users (name, mail, password, registration_date)
        VALUES (%s, %s, %s, NOW())
        RETURNING id, name, mail, registration_date, profile_photo
    """, (username, email, password))
    new_user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    session['user_id'] = new_user[0]

    user_info = {
        'user_id': new_user[0],
        'user_name': new_user[1],
        'user_mail': new_user[2],
        'user_registration_date': new_user[3],
        'user_profile_photo': new_user[4],
    }

    return jsonify(user_info), 201

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        print("IS HERE")
        return jsonify({"error": "Missing required fields"}), 400

    conn = create_connection()
    cursor = conn.cursor()

    # not exist
    cursor.execute("""
    SELECT id 
    FROM users 
    WHERE (name = %s AND password = %s)
    """, (username, password))
    existing_user = cursor.fetchone()
    if not existing_user:
        cursor.close()
        conn.close()
        return jsonify({"error": "False username or password"}), 400

    print(existing_user)
    conn.commit()
    cursor.close()
    conn.close()

    #session['user_id'] = existing_user[0]

    id = {
        'user_id': existing_user[0]
    }

    return jsonify(id), 200

@api_bp.route("/posts/<int:post_id>", methods=['DELETE'])
def api_delete_post(post_id):
    delete_post_by_id(post_id)
    return jsonify({"message": "Post deleted successfully"}), 200

@api_bp.route("/posts/add", methods=['POST'])
def api_add_post():
    post = request.get_json()
    added_post = add_newPost(post)
    return added_post

@api_bp.route("/universities", methods=['GET'])
def api_universities():
    uniName = request.args.get('name', '')
    uniId = request.args.get('id', '')
    universities = get_universities(uniName, uniId)
    return universities

@api_bp.route("/animals/add", methods=['POST'])
def api_add_animal():
    animal = request.get_json()
    added_animal = add_newAnimal(animal)
    return added_animal

@api_bp.route('/users/update', methods=['POST'])
def api_upd_user():
    data = request.get_json()
    upd_user_output = upd_user(data)
    
    return jsonify(upd_user_output)

@api_bp.route("/posts/<int:post_id>/comments", methods=['GET'])
def api_comments(post_id):
    comments = get_comments(post_id)
    return comments

@api_bp.route("/posts/<int:post_id>/comments/add", methods=['POST'])
def api_add_comment(post_id):
    comment = request.get_json()
    added_comment = add_newComment(comment, post_id)
    return added_comment

@api_bp.route("/users/follow/add", methods=['POST'])
def api_add_follow():
    users = request.get_json()
    follow = add_follow(users)
    return follow

@api_bp.route("/users/follow/delete", methods=['DELETE'])
def api_delete_follow():
    users = request.get_json()
    follow = del_follow(users)
    return follow

@api_bp.route("/rooms/public", methods=['GET'])
def api_get_publicRooms():
    room_name = request.args.get('room_name', None)
    publicRooms = get_publicRooms(room_name)
    return publicRooms

@api_bp.route("/users/<int:user_id>/rooms", methods=['GET'])
def api_get_secretRooms(user_id):
    room_name = request.args.get('room_name', None)
    secretRooms = get_secretRooms(user_id, room_name)
    return secretRooms

@api_bp.route("/rooms/<int:room_id>", methods=['GET'])
def api_get_roomInfos(room_id):
    roomInfos = get_roomInfos(room_id)
    return roomInfos

@api_bp.route("/rooms/<int:room_id>/message/send", methods=['POST'])
def api_send_chatMessage(room_id):
    infos = request.get_json()
    print("infos: ", infos)
    user_id = infos['user_id']
    message = infos['message']
    print("heyyy: ", room_id, user_id, message)
    sendedMessage = send_messageToChat(room_id, user_id, message)
    return sendedMessage

@api_bp.route("/rooms/add", methods=['POST'])
def api_add_room():
    room = request.get_json()
    added_room = add_newRoom(room)
    return added_room