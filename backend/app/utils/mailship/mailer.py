import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
load_dotenv()

APP_PWD = os.getenv("MAIL_APPPWD")

def send_email(receiver_email, subject, message):
    msg = MIMEMultipart()
    sender_email = "unimals.web@gmail.com"
    sender_pwd = APP_PWD

    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(message, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        
        server.login(sender_email, sender_pwd)
        
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        
        server.quit()
        print("E-mail sended!")
    except Exception as e:
        print(f"E-mail error: {e}")