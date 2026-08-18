"""
Module pour gérer l'envoi d'emails de contact via Resend
"""

import os
import requests
from firebase_admin import firestore

RESEND_API_URL = 'https://api.resend.com/emails'

def send_contact_email(user_type, name, email, subject, message):
    """
    Envoie un email de contact via SendGrid et sauvegarde dans Firestore
    
    Args:
        user_type: Type d'utilisateur ('marque' ou 'influenceur')
        name: Nom de l'expéditeur
        email: Email de l'expéditeur
        subject: Sujet du message
        message: Contenu du message
    
    Returns:
        dict: Résultat de l'envoi
    """
    try:
        # Récupérer la clé API Resend depuis les variables d'environnement
        resend_api_key = os.environ.get('RESEND_API_KEY')
        sender_email = os.environ.get('RESEND_FROM_EMAIL', 'Collabzz Contact <onboarding@resend.dev>')
        recipient_email = os.environ.get('CONTACT_EMAIL', 'contact@collabzz.com')

        if not resend_api_key:
            return {
                'success': False,
                'error': 'Configuration email non disponible'
            }
        
        # Créer le contenu HTML de l'email
        html_content = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                }}
                .badge {{
                    display: inline-block;
                    padding: 5px 15px;
                    background-color: #EEF2FF;
                    color: #4F46E5;
                    border-radius: 20px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }}
                .info-row {{
                    margin: 15px 0;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-left: 4px solid #4F46E5;
                }}
                .label {{
                    font-weight: bold;
                    color: #4F46E5;
                }}
                .message-box {{
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📧 Nouveau message de contact</h1>
                </div>
                <div class="content">
                    <div class="badge">
                        {user_type.upper()}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Nom :</span> {name}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Email :</span> {email}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Sujet :</span> {subject}
                    </div>
                    
                    <div class="message-box">
                        <p class="label">Message :</p>
                        <p>{message.replace(chr(10), '<br>')}</p>
                    </div>
                    
                    <div class="footer">
                        <p>Ce message a été envoyé depuis le formulaire de contact de Collabzz</p>
                        <p>Pour répondre, utilisez l'adresse : {email}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Envoyer l'email via Resend
        user_type_fr = "Marque" if user_type == "marque" else "Influenceur"
        email_subject = f"[{user_type_fr}] {subject}"

        response = requests.post(
            RESEND_API_URL,
            headers={
                'Authorization': f'Bearer {resend_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'from': sender_email,
                'to': [recipient_email],
                'reply_to': email,
                'subject': email_subject,
                'html': html_content
            },
            timeout=20
        )
        response.raise_for_status()

        # Sauvegarder dans Firestore
        try:
            db = firestore.client()
            contact_data = {
                'userType': user_type,
                'name': name,
                'email': email,
                'subject': subject,
                'message': message,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'read': False
            }
            db.collection('contacts').add(contact_data)
            print(f"Message de contact sauvegardé dans Firestore")
        except Exception as db_error:
            print(f"Erreur lors de la sauvegarde dans Firestore: {str(db_error)}")
            # On continue même si la sauvegarde échoue

        return {
            'success': True,
            'message': 'Email envoyé avec succès',
            'status_code': response.status_code
        }
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return {
            'success': False,
            'error': f'Erreur lors de l\'envoi: {str(e)}'
        }
