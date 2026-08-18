"""
Notifications par email liées aux demandes de collaboration
"""

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content


def send_collaboration_response_email(brand_email, brand_name, influencer_name, package, accepted, frontend_base_url):
    """
    Prévient la marque par email quand un influenceur accepte ou refuse sa demande de collaboration.
    """
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    sender_email = os.environ.get('CONTACT_EMAIL', 'contact@collabzz.com')

    if not sendgrid_api_key or not brand_email:
        return {'success': False, 'error': 'Configuration email non disponible'}

    if accepted:
        subject = f"{influencer_name} a accepté votre demande de collaboration !"
        title = "✅ Collaboration acceptée"
        body_html = f"""
            <p>Bonne nouvelle {brand_name} !</p>
            <p><strong>{influencer_name}</strong> a accepté votre demande pour <strong>{package}</strong>.</p>
            <p>Vous pouvez maintenant procéder au paiement pour lancer la collaboration.</p>
        """
        cta_url = f"{frontend_base_url}/my-profile"
        cta_label = "Payer maintenant"
    else:
        subject = f"{influencer_name} a décliné votre demande de collaboration"
        title = "Collaboration déclinée"
        body_html = f"""
            <p>Bonjour {brand_name},</p>
            <p><strong>{influencer_name}</strong> n'est pas disponible pour <strong>{package}</strong> pour le moment.</p>
            <p>N'hésitez pas à explorer d'autres talents sur Collabzz.</p>
        """
        cta_url = f"{frontend_base_url}/talents"
        cta_label = "Découvrir d'autres talents"

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #E6B067; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">{title}</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
                {body_html}
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{cta_url}" style="background-color: #E6B067; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{cta_label}</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        message = Mail(
            from_email=Email(sender_email, 'Collabzz'),
            to_emails=To(brand_email),
            subject=subject,
            html_content=Content('text/html', html_content)
        )
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        return {'success': True, 'status_code': response.status_code}
    except Exception as exc:
        print(f'Erreur envoi email réponse collaboration: {str(exc)}')
        return {'success': False, 'error': str(exc)}
