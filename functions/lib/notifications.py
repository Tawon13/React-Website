"""
Notifications par email liées aux demandes de collaboration
"""

import os
import html
import requests

RESEND_API_URL = 'https://api.resend.com/emails'


def _send_notification_email(to_email, subject, title, body_html, cta_url=None, cta_label=None):
    resend_api_key = os.environ.get('RESEND_API_KEY')
    sender_email = os.environ.get('RESEND_FROM_EMAIL', 'Collabzz <onboarding@resend.dev>')

    if not resend_api_key or not to_email:
        return {'success': False, 'error': 'Configuration email non disponible'}

    cta_html = f"""
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{cta_url}" style="background-color: #E6B067; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{cta_label}</a>
                </div>
    """ if cta_url and cta_label else ""

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #E6B067; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">{title}</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
                {body_html}
                {cta_html}
            </div>
        </div>
    </body>
    </html>
    """

    try:
        response = requests.post(
            RESEND_API_URL,
            headers={
                'Authorization': f'Bearer {resend_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'from': sender_email,
                'to': [to_email],
                'subject': subject,
                'html': html_content
            },
            timeout=20
        )
        response.raise_for_status()
        return {'success': True, 'status_code': response.status_code}
    except Exception as exc:
        print(f'Erreur envoi email notification: {str(exc)}')
        return {'success': False, 'error': str(exc)}


def send_verification_code_email(to_email, name, code):
    """
    Envoie le code à 6 chiffres permettant de valider l'adresse email lors de l'inscription.
    """
    subject = f"{code} est votre code de vérification Collabzz"
    title = "Validation de l'adresse email"
    body_html = f"""
        <p>Bonjour {name},</p>
        <p>Voici votre code de vérification pour valider votre adresse email :</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #E6B067; background-color: #FBF3E7; padding: 16px 24px; border-radius: 8px;">{code}</span>
        </div>
        <p>Ce code expire dans 15 minutes. Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.</p>
    """

    return _send_notification_email(
        to_email=to_email,
        subject=subject,
        title=title,
        body_html=body_html
    )


def send_welcome_email(to_email, name, user_type, frontend_base_url):
    """
    Envoie un email de bienvenue après la création d'un compte influenceur ou marque.
    """
    is_brand = user_type == 'brand'
    subject = "Bienvenue sur Collabzz !"
    title = f"👋 Bienvenue sur Collabzz, {name} !"

    if is_brand:
        body_html = f"""
            <p>Bonjour {name},</p>
            <p>Votre compte marque a été créé avec succès. Vous pouvez dès maintenant explorer nos talents et lancer vos premières collaborations.</p>
        """
        cta_url = f"{frontend_base_url}/talents"
        cta_label = "Découvrir les talents"
    else:
        body_html = f"""
            <p>Bonjour {name},</p>
            <p>Votre compte influenceur a été créé avec succès. Complétez votre profil pour commencer à recevoir des demandes de collaboration.</p>
        """
        cta_url = f"{frontend_base_url}/my-profile"
        cta_label = "Compléter mon profil"

    return _send_notification_email(
        to_email=to_email,
        subject=subject,
        title=title,
        body_html=body_html,
        cta_url=cta_url,
        cta_label=cta_label
    )


def send_new_collaboration_request_email(influencer_email, influencer_name, brand_name, package, amount, frontend_base_url, brand_id):
    """
    Prévient l'influenceur par email qu'une marque lui a envoyé une nouvelle demande de collaboration.
    """
    subject = f"{brand_name} souhaite collaborer avec vous !"
    title = "📩 Nouvelle demande de collaboration"
    body_html = f"""
        <p>Bonjour {influencer_name},</p>
        <p><strong>{brand_name}</strong> souhaite collaborer avec vous pour <strong>{package}</strong> ({amount} €).</p>
        <p>Rendez-vous dans vos messages pour échanger avec la marque et répondre à cette demande.</p>
    """

    return _send_notification_email(
        to_email=influencer_email,
        subject=subject,
        title=title,
        body_html=body_html,
        cta_url=f"{frontend_base_url}/messages?brandId={brand_id}",
        cta_label="Voir la demande"
    )


def send_new_message_email(to_email, recipient_name, sender_name, message_preview, frontend_base_url, cta_url):
    """
    Prévient un utilisateur par email qu'il a reçu un nouveau message dans la messagerie.
    """
    subject = f"{sender_name} vous a envoyé un message"
    title = "💬 Nouveau message"
    safe_preview = html.escape(message_preview)[:280]
    body_html = f"""
        <p>Bonjour {recipient_name},</p>
        <p><strong>{sender_name}</strong> vous a envoyé un message sur Collabzz :</p>
        <div style="margin: 20px 0; padding: 16px; background-color: #f9f9f9; border-left: 4px solid #E6B067; border-radius: 4px; color: #555; font-style: italic;">
            {safe_preview}
        </div>
    """

    return _send_notification_email(
        to_email=to_email,
        subject=subject,
        title=title,
        body_html=body_html,
        cta_url=cta_url,
        cta_label="Répondre"
    )


def send_dispute_refund_email(to_email, name, other_party_name, package, frontend_base_url):
    """
    Prévient l'autre partie qu'une collaboration a été annulée et intégralement remboursée
    suite à un désaccord.
    """
    subject = "Collaboration annulée et remboursée"
    title = "↩️ Collaboration annulée"
    body_html = f"""
        <p>Bonjour {name},</p>
        <p><strong>{other_party_name}</strong> a signalé un désaccord sur la collaboration <strong>{package}</strong>.</p>
        <p>La collaboration a été annulée et la marque a été intégralement remboursée. Les fonds ne seront pas versés.</p>
        <p>Pour toute question, vous pouvez nous contacter directement.</p>
    """

    return _send_notification_email(
        to_email=to_email,
        subject=subject,
        title=title,
        body_html=body_html,
        cta_url=f"{frontend_base_url}/messages",
        cta_label="Voir mes messages"
    )


def send_collaboration_response_email(brand_email, brand_name, influencer_name, package, accepted, frontend_base_url):
    """
    Prévient la marque par email quand un influenceur accepte ou refuse sa demande de collaboration.
    """
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

    return _send_notification_email(
        to_email=brand_email,
        subject=subject,
        title=title,
        body_html=body_html,
        cta_url=cta_url,
        cta_label=cta_label
    )
