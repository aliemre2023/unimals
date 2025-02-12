from app.utils.db_utils import *
from flask import jsonify


def delete_post_by_id(post_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
    conn.commit()
    cursor.close()
    conn.close()


def del_follow(users):
    conn = create_connection()
    cursor = conn.cursor()

    print("delete part", users)

    cursor.execute("""
    DELETE FROM follower_table
    WHERE user_id = %s AND follows = %s;
    """, (users['currentUserId'], users['userId']))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 200})