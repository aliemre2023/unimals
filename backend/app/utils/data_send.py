from app.utils.db_utils import *
from app.utils.mailship.mailer import send_email
from flask import jsonify
import random

def forgotmypassword_mail(email):
    conn = create_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        users.id,
        users.name
    FROM users
    WHERE mail = %s;
    """

    cursor.execute(query, (email,))
    user = cursor.fetchone()
    print("user: ", user)

    if user is None:
        return jsonify({
            "status": 400,
            "response_message": "No mail matched"
        })
    else:
        new_pwd = str(random.randint(100000, 999999))

        cursor.execute("""
        UPDATE users
        SET password = %s
        WHERE mail = %s;
        """, (new_pwd, email,))

        conn.commit()
        cursor.close()
        conn.close()
        
        send_email(
            receiver_email=email,
            subject="Unimals, Password Assistance",
            message=f"You seem to have forgotten your password, here's the new one: {new_pwd}"
        )
        
        return jsonify({
            "status": 200,
            "response_message": "Mail sent!, check spam folder!"
        })