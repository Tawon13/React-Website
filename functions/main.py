"""
Cloud Functions pour Collabzz
Intégration YouTube et TikTok avec OAuth et mise à jour automatique
"""

import os
import time
import hmac
import base64
import hashlib
from firebase_functions import https_fn, scheduler_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, firestore, auth as firebase_auth
from dotenv import load_dotenv

# Charger les variables d'environnement (pour le développement local)
load_dotenv()

# Initialiser Firebase Admin
initialize_app()

# Importer les modules YouTube, TikTok et Instagram
from lib.youtube import connect_youtube, youtube_callback, update_youtube_stats
from lib.tiktok import connect_tiktok, tiktok_callback, update_tiktok_stats
from lib.instagram import connect_instagram, instagram_callback, update_instagram_stats
from lib.contact import send_contact_email
from lib.token_store import get_user_tokens

# Configuration globale
set_global_options(max_instances=10)

STATE_SIGNING_SECRET = os.getenv('STATE_SIGNING_SECRET')
if not STATE_SIGNING_SECRET:
    raise ValueError('STATE_SIGNING_SECRET environment variable is required')

STATE_TTL_SECONDS = int(os.getenv('STATE_TTL_SECONDS', '600'))


class AuthorizationError(Exception):
    """Erreur personnalisée pour les problèmes d'authentification."""

    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.status = status


def _sign_message(message: str) -> str:
    digest = hmac.new(
        STATE_SIGNING_SECRET.encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')


def generate_signed_state(user_id: str) -> str:
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{timestamp}"
    signature = _sign_message(payload)
    return f"{payload}:{signature}"


def verify_signed_state(state_token: str) -> str:
    try:
        user_id, issued_at, signature = state_token.split(':', 2)
    except ValueError:
        raise AuthorizationError('Invalid state parameter', status=400)

    expected_signature = _sign_message(f"{user_id}:{issued_at}")
    if not hmac.compare_digest(signature, expected_signature):
        raise AuthorizationError('Invalid state signature', status=400)

    if time.time() - int(issued_at) > STATE_TTL_SECONDS:
        raise AuthorizationError('State parameter expired', status=400)

    return user_id


def _extract_id_token(req: https_fn.Request) -> str | None:
    auth_header = req.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1]
    return req.args.get('idToken')


def authenticate_user(req: https_fn.Request, expected_user_id: str) -> str:
    id_token = _extract_id_token(req)
    if not id_token:
        raise AuthorizationError('Missing idToken parameter', status=401)
    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        raise AuthorizationError('Invalid ID token', status=401) from exc

    uid = decoded.get('uid')
    if uid != expected_user_id:
        raise AuthorizationError('Authenticated user mismatch', status=403)
    return uid


# ============================================
# ROUTES HTTP - OAuth YouTube
# ============================================

@https_fn.on_request()
def youtube_connect(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 1 : Redirige vers l'autorisation YouTube
    URL: /youtube_connect?userId=xxx
    """
    # Ajouter CORS headers
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return https_fn.Response('', status=204, headers=headers)
    
    user_id = req.args.get('userId')
    
    if not user_id:
        return https_fn.Response('Missing userId parameter', status=400)
    
    try:
        authenticate_user(req, user_id)
        signed_state = generate_signed_state(user_id)
        auth_url = connect_youtube(user_id, signed_state)
        # Rediriger vers YouTube
        return https_fn.Response(
            status=302,
            headers={'Location': auth_url}
        )
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur youtube_connect: {str(e)}')
        return https_fn.Response(f'Error: {str(e)}', status=500)


@https_fn.on_request()
def youtube_callback_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 2 : Callback après autorisation YouTube
    URL: /youtube_callback?code=xxx&state=userId
    """
    # CORS headers
    headers = {'Access-Control-Allow-Origin': '*'}
    
    code = req.args.get('code')
    state = req.args.get('state')
    
    if not code or not state:
        return https_fn.Response('Missing code or state', status=400)
    
    try:
        user_id = verify_signed_state(state)
        result = youtube_callback(code, user_id)
        
        # Retourner une page HTML qui ferme la popup et notifie le parent
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Connecté</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    color: #333;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>YouTube Connecté !</h1>
                <p><strong>{result['channelName']}</strong></p>
                <p>{result['subscribers']:,} abonnés • {result['videoCount']} vidéos</p>
                <p style="color: #666; margin-top: 20px;">Cette fenêtre va se fermer...</p>
            </div>
            <script>
                // Notifier la fenêtre parente
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'youtube-connected',
                        data: {result}
                    }}, '*');
                }}
                // Fermer la popup après 2 secondes
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """
        
        return https_fn.Response(html, headers={
            'Content-Type': 'text/html; charset=utf-8'
        })
        
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur youtube_callback: {str(e)}')
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>{str(e)}</p>
            <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        """
        return https_fn.Response(html, status=500, headers={'Content-Type': 'text/html'})


# ============================================
# ROUTES HTTP - OAuth TikTok
# ============================================

@https_fn.on_request()
def tiktok_connect(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 1 : Redirige vers l'autorisation TikTok
    URL: /tiktok_connect?userId=xxx
    """
    # CORS
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return https_fn.Response('', status=204, headers=headers)
    
    user_id = req.args.get('userId')
    
    if not user_id:
        return https_fn.Response('Missing userId parameter', status=400)
    
    try:
        authenticate_user(req, user_id)
        signed_state = generate_signed_state(user_id)
        auth_url = connect_tiktok(user_id, signed_state)
        print(f'TikTok auth URL generated: {auth_url}')
        # Rediriger vers TikTok
        return https_fn.Response(
            status=302,
            headers={'Location': auth_url}
        )
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur tiktok_connect: {str(e)}')
        import traceback
        traceback.print_exc()
        return https_fn.Response(f'Error: {str(e)}', status=500)


@https_fn.on_request()
def tiktok_callback_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 2 : Callback après autorisation TikTok
    URL: /tiktok_callback?code=xxx&state=userId
    """
    # CORS headers
    headers = {'Access-Control-Allow-Origin': '*'}
    
    code = req.args.get('code')
    state = req.args.get('state')
    
    if not code or not state:
        return https_fn.Response('Missing code or state', status=400)
    
    try:
        user_id = verify_signed_state(state)
        result = tiktok_callback(code, user_id)
        
        # Page HTML de succès
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TikTok Connecté</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #000000 0%, #fe2c55 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    color: #333;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>TikTok Connecté !</h1>
                <p><strong>@{result['username']}</strong></p>
                <p>{result['followers']:,} abonnés • {result['videoCount']} vidéos</p>
                <p style="color: #666; margin-top: 20px;">Cette fenêtre va se fermer...</p>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'tiktok-connected',
                        data: {result}
                    }}, '*');
                }}
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """
        
        return https_fn.Response(html, headers={
            'Content-Type': 'text/html; charset=utf-8'
        })
        
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur tiktok_callback: {str(e)}')
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>{str(e)}</p>
            <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        """
        return https_fn.Response(html, status=500, headers={'Content-Type': 'text/html'})


# ============================================
# ROUTES HTTP - OAuth Instagram
# ============================================

@https_fn.on_request()
def instagram_connect(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 1 : Redirige vers l'autorisation Instagram
    URL: /instagram_connect?userId=xxx
    """
    # CORS
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return https_fn.Response('', status=204, headers=headers)
    
    user_id = req.args.get('userId')
    
    if not user_id:
        return https_fn.Response('Missing userId parameter', status=400)
    
    try:
        authenticate_user(req, user_id)
        signed_state = generate_signed_state(user_id)
        auth_url = connect_instagram(user_id, signed_state)
        print(f'Instagram auth URL generated: {auth_url}')
        # Rediriger vers Instagram
        return https_fn.Response(
            status=302,
            headers={'Location': auth_url}
        )
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur instagram_connect: {str(e)}')
        import traceback
        traceback.print_exc()
        return https_fn.Response(f'Error: {str(e)}', status=500)


@https_fn.on_request()
def instagram_callback_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 2 : Callback après autorisation Instagram
    URL: /instagram_callback?code=xxx&state=userId
    """
    # CORS headers
    headers = {'Access-Control-Allow-Origin': '*'}
    
    code = req.args.get('code')
    state = req.args.get('state')
    
    if not code or not state:
        return https_fn.Response('Missing code or state', status=400)
    
    try:
        user_id = verify_signed_state(state)
        result = instagram_callback(code, user_id)
        
        # Retourner une page HTML qui ferme la popup et notifie le parent
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Instagram Connecté</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #405DE6, #5B51D8, #833AB4, #C13584, #E1306C, #FD1D1D);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    color: #333;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>Instagram Connecté !</h1>
                <p><strong>@{result['username']}</strong></p>
                <p>{result['mediaCount']} publications</p>
                <p style="color: #666; margin-top: 20px;">Cette fenêtre va se fermer...</p>
            </div>
            <script>
                // Notifier la fenêtre parente
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'instagram-connected',
                        data: {result}
                    }}, '*');
                }}
                // Fermer la popup après 2 secondes
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """
        
        return https_fn.Response(html, headers={
            'Content-Type': 'text/html; charset=utf-8'
        })
        
    except AuthorizationError as auth_err:
        return https_fn.Response(str(auth_err), status=auth_err.status)
    except Exception as e:
        print(f'Erreur instagram_callback: {str(e)}')
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>{str(e)}</p>
            <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        """
        return https_fn.Response(html, status=500, headers={'Content-Type': 'text/html'})


# ============================================
# FONCTION PLANIFIÉE - Mise à jour quotidienne
# ============================================

@scheduler_fn.on_schedule(schedule="0 2 * * *", timezone="Europe/Paris")
def daily_stats_update(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Mise à jour quotidienne des statistiques YouTube et TikTok
    S'exécute tous les jours à 2h du matin (heure de Paris)
    """
    print("🚀 Début de la mise à jour quotidienne des stats")
    
    db = firestore.client()
    
    # Récupérer tous les influenceurs avec au moins un compte connecté
    influencers = db.collection('influencers').stream()
    
    update_count = 0
    error_count = 0
    
    for influencer in influencers:
        user_id = influencer.id
        data = influencer.to_dict()
        
        social_accounts = data.get('socialAccounts', {})
        user_tokens = get_user_tokens(user_id)
        
        # Mettre à jour YouTube si connecté
        if social_accounts.get('youtube', {}).get('connected'):
            youtube_tokens = user_tokens.get('youtube', {})
            if youtube_tokens:
                print(f"📺 Mise à jour YouTube pour {user_id}")
                result = update_youtube_stats(user_id, youtube_tokens)
                if result.get('success'):
                    update_count += 1
                    print(f"✅ YouTube mis à jour: {result.get('subscribers')} abonnés")
                else:
                    error_count += 1
                    print(f"❌ Erreur YouTube: {result.get('error')}")
        
        # Mettre à jour TikTok si connecté
        if social_accounts.get('tiktok', {}).get('connected'):
            tiktok_tokens = user_tokens.get('tiktok', {})
            if tiktok_tokens:
                print(f"🎵 Mise à jour TikTok pour {user_id}")
                result = update_tiktok_stats(user_id, tiktok_tokens)
                if result.get('success'):
                    update_count += 1
                    print(f"✅ TikTok mis à jour: {result.get('followers')} abonnés")
                else:
                    error_count += 1
                    print(f"❌ Erreur TikTok: {result.get('error')}")
    
    print(f"✨ Mise à jour terminée: {update_count} succès, {error_count} erreurs")


# ============================================
# ROUTE HTTP - Formulaire de contact
# ============================================

@https_fn.on_request()
def send_contact_email_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Envoie un email depuis le formulaire de contact
    URL: /send_contact_email
    """
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=utf-8'
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    if req.method != 'POST':
        return https_fn.Response(
            '{"error": "Méthode non autorisée"}',
            status=405,
            headers=headers
        )
    
    try:
        # Récupérer les données du formulaire
        data = req.get_json()
        
        user_type = data.get('userType', '')
        name = data.get('name', '')
        email = data.get('email', '')
        subject = data.get('subject', '')
        message = data.get('message', '')
        
        # Validation des champs requis
        if not all([user_type, name, email, subject, message]):
            return https_fn.Response(
                '{"error": "Tous les champs sont requis"}',
                status=400,
                headers=headers
            )
        
        # Envoyer l'email
        result = send_contact_email(user_type, name, email, subject, message)
        
        if result.get('success'):
            return https_fn.Response(
                '{"success": true, "message": "Email envoyé avec succès"}',
                status=200,
                headers=headers
            )
        else:
            return https_fn.Response(
                f'{{"error": "{result.get("error", "Erreur inconnue")}"}}',
                status=500,
                headers=headers
            )
    
    except Exception as e:
        print(f"Erreur send_contact_email: {str(e)}")
        return https_fn.Response(
            f'{{"error": "Erreur serveur: {str(e)}"}}',
            status=500,
            headers=headers
        )
