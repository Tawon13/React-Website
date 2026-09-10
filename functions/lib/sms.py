"""
Notifications par SMS (Twilio) liées aux demandes de collaboration.
"""

import os
import re

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')


def _to_e164(phone, default_country_code='+33'):
    """
    Normalise un numéro français saisi localement (ex: "06 12 34 56 78") au format
    E.164 attendu par Twilio (+33612345678). Laisse passer un numéro déjà saisi au
    format international. Renvoie None si le numéro ne peut pas être interprété.
    """
    if not phone:
        return None

    digits = re.sub(r'[^\d+]', '', phone)

    if digits.startswith('+'):
        return digits

    # Format français local : 0X XX XX XX XX -> +33X XX XX XX XX
    if digits.startswith('0') and len(digits) == 10:
        return f'{default_country_code}{digits[1:]}'

    return None


def send_sms(phone, body):
    """
    Envoie un SMS via Twilio. Best-effort : ne lève jamais d'exception, renvoie
    {'success': False, 'error': ...} si la config Twilio est absente, le numéro
    invalide, ou l'envoi échoue — ne doit jamais faire échouer l'action qui l'appelle.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        return {'success': False, 'error': 'Configuration Twilio non disponible'}

    to_number = _to_e164(phone)
    if not to_number:
        return {'success': False, 'error': 'Numéro de téléphone invalide'}

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        return {'success': True, 'sid': message.sid}
    except Exception as exc:
        print(f'Erreur envoi SMS Twilio: {str(exc)}')
        return {'success': False, 'error': str(exc)}


def send_new_collaboration_request_sms(phone, brand_name, package, amount):
    """
    Prévient l'influenceur par SMS qu'une marque lui a envoyé une nouvelle demande
    de collaboration.
    """
    body = (
        f"Collabzz : {brand_name} souhaite collaborer avec vous pour {package} "
        f"({amount:.0f}€). Consultez vos messages sur Collabzz pour répondre."
    )
    return send_sms(phone, body)
