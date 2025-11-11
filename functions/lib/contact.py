"""
Module pour gérer l'envoi d'emails de contact via SendGrid
"""

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

def send_contact_email(user_type, name, email, subject, message):
    """
    Envoie un email de contact via SendGrid
    
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
        # Récupérer la clé API SendGrid depuis les variables d'environnement
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        recipient_email = os.environ.get('CONTACT_EMAIL', 'contact@collabzz.com')
        
        if not sendgrid_api_key:
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
        
        # Créer l'objet email
        user_type_fr = "Marque" if user_type == "marque" else "Influenceur"
        email_subject = f"[{user_type_fr}] {subject}"
        
        message = Mail(
            from_email=Email('noreply@collabzz.com', 'Collabzz Contact'),
            to_emails=To(recipient_email),
            subject=email_subject,
            html_content=Content("text/html", html_content)
        )
        
        # Ajouter l'email de l'expéditeur en reply-to
        message.reply_to = Email(email, name)
        
        # Envoyer l'email
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
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
