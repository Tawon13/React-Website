"""
Cloud Functions pour Collabzz
Intégration YouTube et TikTok avec OAuth et mise à jour automatique
"""

import os
import time
import hmac
import base64
import hashlib
import json
import stripe
from firebase_functions import https_fn, scheduler_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, auth as firebase_auth
from dotenv import load_dotenv

# Charger les variables d'environnement (pour le développement local)
load_dotenv()

# Initialiser Firebase Admin
initialize_app()


def _firestore():
    from firebase_admin import firestore
    return firestore


class _FirestoreProxy:
    def __getattr__(self, name: str):
        return getattr(_firestore(), name)


firestore = _FirestoreProxy()

# Les imports des modules métiers sont faits en lazy import
# pour réduire le temps de chargement au déploiement.

# Configuration globale
set_global_options(max_instances=10)

STATE_SIGNING_SECRET = os.getenv('STATE_SIGNING_SECRET')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

STATE_TTL_SECONDS = int(os.getenv('STATE_TTL_SECONDS', '600'))


class AuthorizationError(Exception):
    """Erreur personnalisée pour les problèmes d'authentification."""

    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.status = status


def _sign_message(message: str) -> str:
    if not STATE_SIGNING_SECRET:
        raise RuntimeError('STATE_SIGNING_SECRET environment variable is required')

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


def _get_authenticated_uid(req: https_fn.Request) -> str:
    id_token = _extract_id_token(req)
    if not id_token:
        raise AuthorizationError('Missing idToken parameter', status=401)
    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        raise AuthorizationError('Invalid ID token', status=401) from exc
    uid = decoded.get('uid')
    if not uid:
        raise AuthorizationError('Invalid authenticated user', status=401)
    return uid


def _json_response(payload: dict, status: int = 200) -> https_fn.Response:
    return https_fn.Response(
        json.dumps(payload, ensure_ascii=False),
        status=status,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json; charset=utf-8'
        }
    )


def _handle_options(req: https_fn.Request) -> https_fn.Response | None:
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        })
    return None


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
        from lib.youtube import connect_youtube

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
        from lib.youtube import youtube_callback

        user_id = verify_signed_state(state)
        result = youtube_callback(code, user_id)
        
        # Redirection directe vers Mon Profil sans afficher de page intermédiaire
        result_json = json.dumps(result)
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'youtube-connected',
                        data: {result_json}
                    }}, '*');
                    window.close();
                }} else {{
                    window.location.href = '/my_profil';
                }}
            </script>
        </head>
        <body></body>
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
        from lib.tiktok import connect_tiktok

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
        from lib.tiktok import tiktok_callback

        user_id = verify_signed_state(state)
        result = tiktok_callback(code, user_id)
        
        # Redirection directe vers Mon Profil sans afficher de page intermédiaire
        result_json = json.dumps(result)
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'tiktok-connected',
                        data: {result_json}
                    }}, '*');
                    window.close();
                }} else {{
                    window.location.href = '/my_profil';
                }}
            </script>
        </head>
        <body></body>
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
        from lib.instagram import connect_instagram

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
        from lib.instagram import instagram_callback

        user_id = verify_signed_state(state)
        result = instagram_callback(code, user_id)
        
        # Redirection directe vers Mon Profil sans afficher de page intermédiaire
        result_json = json.dumps(result)
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'instagram-connected',
                        data: {result_json}
                    }}, '*');
                    window.close();
                }} else {{
                    window.location.href = '/my_profil';
                }}
            </script>
        </head>
        <body></body>
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
# ROUTES HTTP - Stripe Connect + Escrow logique
# ============================================

@https_fn.on_request()
def create_stripe_connect_onboarding_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Crée (ou réutilise) un compte Stripe Connect Express pour un influenceur
    et retourne un lien d'onboarding.
    """
    options_response = _handle_options(req)
    if options_response:
        return options_response

    if req.method != 'POST':
        return _json_response({'error': 'Méthode non autorisée'}, status=405)

    if not STRIPE_SECRET_KEY:
        return _json_response({'error': 'STRIPE_SECRET_KEY manquante'}, status=500)

    try:
        uid = _get_authenticated_uid(req)
        db_client = firestore.client()
        influencer_ref = db_client.collection('influencers').document(uid)
        influencer_snap = influencer_ref.get()

        if not influencer_snap.exists:
            return _json_response({'error': 'Compte influenceur introuvable'}, status=403)

        influencer_data = influencer_snap.to_dict() or {}
        stripe_account_id = influencer_data.get('stripeAccountId')

        if not stripe_account_id:
            account = stripe.Account.create(
                type='express',
                country='FR',
                email=influencer_data.get('email'),
                capabilities={'transfers': {'requested': True}},
                business_type='individual'
            )
            stripe_account_id = account.id
            influencer_ref.update({
                'stripeAccountId': stripe_account_id,
                'stripeOnboardingStatus': 'pending',
                'updatedAt': firestore.SERVER_TIMESTAMP
            })

        account_link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=f'{FRONTEND_BASE_URL}/my_profil?stripe=refresh',
            return_url=f'{FRONTEND_BASE_URL}/my_profil?stripe=connected',
            type='account_onboarding'
        )

        return _json_response({
            'success': True,
            'accountId': stripe_account_id,
            'url': account_link.url
        })
    except AuthorizationError as auth_err:
        return _json_response({'error': str(auth_err)}, status=auth_err.status)
    except Exception as exc:
        print(f'Erreur create_stripe_connect_onboarding_handler: {str(exc)}')
        return _json_response({'error': str(exc)}, status=500)


@https_fn.on_request()
def create_checkout_session_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Crée la session Stripe Checkout et des collaborations en statut paiement en attente.
    Les fonds restent sur le compte plateforme jusqu'à validation des 2 parties.
    """
    options_response = _handle_options(req)
    if options_response:
        return options_response

    if req.method != 'POST':
        return _json_response({'error': 'Méthode non autorisée'}, status=405)

    if not STRIPE_SECRET_KEY:
        return _json_response({'error': 'STRIPE_SECRET_KEY manquante'}, status=500)

    try:
        uid = _get_authenticated_uid(req)
        payload = req.get_json(silent=True) or {}
        items = payload.get('items', [])

        if not isinstance(items, list) or len(items) == 0:
            return _json_response({'error': 'Panier vide'}, status=400)

        db_client = firestore.client()
        brand_ref = db_client.collection('brands').document(uid)
        brand_snap = brand_ref.get()
        if not brand_snap.exists:
            return _json_response({'error': 'Seules les marques peuvent payer'}, status=403)

        brand_data = brand_snap.to_dict() or {}
        brand_name = brand_data.get('brandName', 'Marque')
        brand_email = brand_data.get('email', '')

        collaborations_ref = db_client.collection('collaborations')
        conversations_ref = db_client.collection('conversations')

        line_items = []
        collaboration_ids = []

        for item in items:
            influencer_id = item.get('influencerId')
            package_name = item.get('package', 'Collaboration')
            quantity = int(item.get('quantity', 1))
            unit_price = float(item.get('price', 0))

            if not influencer_id or quantity <= 0 or unit_price <= 0:
                continue

            influencer_ref = db_client.collection('influencers').document(influencer_id)
            influencer_snap = influencer_ref.get()
            if not influencer_snap.exists:
                continue

            influencer_data = influencer_snap.to_dict() or {}
            influencer_name = influencer_data.get('name', 'Influenceur')
            influencer_email = influencer_data.get('email', '')

            # Crée une collaboration par quantité pour faciliter la validation et le paiement final.
            for _ in range(quantity):
                collab_ref = collaborations_ref.document()
                collab_ref.set({
                    'brandId': uid,
                    'brandName': brand_name,
                    'brandEmail': brand_email,
                    'influencerId': influencer_id,
                    'influencerName': influencer_name,
                    'influencerEmail': influencer_email,
                    'description': f'Collaboration: {package_name}',
                    'package': package_name,
                    'amount': unit_price,
                    'status': 'pending',
                    'paymentStatus': 'awaiting_payment',
                    'payoutStatus': 'not_released',
                    'brandApproved': False,
                    'influencerApproved': False,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                collaboration_ids.append(collab_ref.id)

            line_items.append({
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'{influencer_name} - {package_name}'
                    },
                    'unit_amount': int(round(unit_price * 100))
                },
                'quantity': quantity
            })

            # Conversation unique brand <-> influencer
            existing_conv = conversations_ref.where('brandId', '==', uid).where('influencerId', '==', influencer_id).limit(1).get()
            if len(existing_conv) == 0:
                conversations_ref.add({
                    'brandId': uid,
                    'brandName': brand_name,
                    'brandEmail': brand_email,
                    'influencerId': influencer_id,
                    'influencerName': influencer_name,
                    'influencerEmail': influencer_email,
                    'lastMessage': f'Nouvelle collaboration: {package_name}',
                    'lastMessageAt': firestore.SERVER_TIMESTAMP,
                    'lastMessageBy': uid,
                    'createdAt': firestore.SERVER_TIMESTAMP
                })

        if len(line_items) == 0 or len(collaboration_ids) == 0:
            return _json_response({'error': 'Impossible de créer le paiement pour ce panier'}, status=400)

        checkout_session = stripe.checkout.Session.create(
            mode='payment',
            payment_method_types=['card'],
            line_items=line_items,
            success_url=f'{FRONTEND_BASE_URL}/messages?payment=success',
            cancel_url=f'{FRONTEND_BASE_URL}/cart?payment=cancelled',
            metadata={
                'brandId': uid
            }
        )

        db_client.collection('paymentSessions').document(checkout_session.id).set({
            'brandId': uid,
            'collaborationIds': collaboration_ids,
            'checkoutSessionId': checkout_session.id,
            'status': 'created',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        return _json_response({
            'success': True,
            'sessionId': checkout_session.id,
            'url': checkout_session.url,
            'collaborationCount': len(collaboration_ids)
        })
    except AuthorizationError as auth_err:
        return _json_response({'error': str(auth_err)}, status=auth_err.status)
    except Exception as exc:
        print(f'Erreur create_checkout_session_handler: {str(exc)}')
        return _json_response({'error': str(exc)}, status=500)


@https_fn.on_request()
def stripe_webhook_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Webhook Stripe: confirme les paiements et passe les collaborations en fonds en attente.
    """
    if req.method != 'POST':
        return https_fn.Response('Méthode non autorisée', status=405)

    if not STRIPE_SECRET_KEY:
        return https_fn.Response('STRIPE_SECRET_KEY manquante', status=500)

    try:
        payload = req.get_data()
        sig_header = req.headers.get('Stripe-Signature')

        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(payload)

        event_type = event.get('type')
        event_data = event.get('data', {}).get('object', {})

        db_client = firestore.client()

        if event_type == 'checkout.session.completed':
            session_id = event_data.get('id')
            payment_intent_id = event_data.get('payment_intent')

            session_ref = db_client.collection('paymentSessions').document(session_id)
            session_snap = session_ref.get()
            if session_snap.exists:
                session_data = session_snap.to_dict() or {}
                collab_ids = session_data.get('collaborationIds', [])

                for collab_id in collab_ids:
                    collab_ref = db_client.collection('collaborations').document(collab_id)
                    collab_ref.update({
                        'paymentStatus': 'funds_held',
                        'stripeCheckoutSessionId': session_id,
                        'stripePaymentIntentId': payment_intent_id,
                        'paymentHeldAt': firestore.SERVER_TIMESTAMP,
                        'updatedAt': firestore.SERVER_TIMESTAMP
                    })

                session_ref.update({
                    'status': 'paid',
                    'stripePaymentIntentId': payment_intent_id,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })

        if event_type == 'checkout.session.expired':
            session_id = event_data.get('id')
            session_ref = db_client.collection('paymentSessions').document(session_id)
            session_snap = session_ref.get()
            if session_snap.exists:
                session_data = session_snap.to_dict() or {}
                collab_ids = session_data.get('collaborationIds', [])

                for collab_id in collab_ids:
                    collab_ref = db_client.collection('collaborations').document(collab_id)
                    collab_ref.update({
                        'paymentStatus': 'cancelled',
                        'updatedAt': firestore.SERVER_TIMESTAMP
                    })

                session_ref.update({
                    'status': 'expired',
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })

        return https_fn.Response('ok', status=200)
    except Exception as exc:
        print(f'Erreur stripe_webhook_handler: {str(exc)}')
        return https_fn.Response(f'Webhook error: {str(exc)}', status=400)


@https_fn.on_request()
def approve_collaboration_delivery_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Validation par marque/influenceur. Quand les 2 ont validé,
    versement 85% à l'influenceur (Stripe Connect Transfer), 15% conservés plateforme.
    """
    options_response = _handle_options(req)
    if options_response:
        return options_response

    if req.method != 'POST':
        return _json_response({'error': 'Méthode non autorisée'}, status=405)

    if not STRIPE_SECRET_KEY:
        return _json_response({'error': 'STRIPE_SECRET_KEY manquante'}, status=500)

    try:
        uid = _get_authenticated_uid(req)
        payload = req.get_json(silent=True) or {}
        collaboration_id = payload.get('collaborationId')

        if not collaboration_id:
            return _json_response({'error': 'collaborationId requis'}, status=400)

        db_client = firestore.client()
        collab_ref = db_client.collection('collaborations').document(collaboration_id)
        collab_snap = collab_ref.get()

        if not collab_snap.exists:
            return _json_response({'error': 'Collaboration introuvable'}, status=404)

        collab = collab_snap.to_dict() or {}
        brand_id = collab.get('brandId')
        influencer_id = collab.get('influencerId')

        if uid not in [brand_id, influencer_id]:
            return _json_response({'error': 'Non autorisé pour cette collaboration'}, status=403)

        if collab.get('paymentStatus') != 'funds_held':
            return _json_response({'error': 'Le paiement n\'est pas encore en attente sécurisée'}, status=400)

        if collab.get('payoutStatus') == 'paid':
            return _json_response({
                'success': True,
                'alreadyPaid': True,
                'message': 'Versement déjà effectué'
            })

        update_data = {
            'updatedAt': firestore.SERVER_TIMESTAMP
        }

        if uid == brand_id:
            update_data['brandApproved'] = True
            update_data['brandApprovedAt'] = firestore.SERVER_TIMESTAMP
        if uid == influencer_id:
            update_data['influencerApproved'] = True
            update_data['influencerApprovedAt'] = firestore.SERVER_TIMESTAMP

        collab_ref.update(update_data)

        latest_collab = collab_ref.get().to_dict() or {}
        brand_approved = bool(latest_collab.get('brandApproved'))
        influencer_approved = bool(latest_collab.get('influencerApproved'))

        if not (brand_approved and influencer_approved):
            return _json_response({
                'success': True,
                'waitingForOtherParty': True,
                'brandApproved': brand_approved,
                'influencerApproved': influencer_approved,
                'message': 'Validation enregistrée. En attente de l\'autre partie.'
            })

        influencer_ref = db_client.collection('influencers').document(influencer_id)
        influencer_snap = influencer_ref.get()
        influencer_data = influencer_snap.to_dict() or {}
        stripe_account_id = influencer_data.get('stripeAccountId')

        if not stripe_account_id:
            return _json_response({
                'error': 'Influenceur non connecté à Stripe. Créez le compte Stripe Connect avant libération.'
            }, status=400)

        gross_cents = int(round(float(latest_collab.get('amount', 0)) * 100))
        if gross_cents <= 0:
            return _json_response({'error': 'Montant invalide'}, status=400)

        influencer_cents = int(round(gross_cents * 0.85))
        platform_fee_cents = gross_cents - influencer_cents

        transfer = stripe.Transfer.create(
            amount=influencer_cents,
            currency='eur',
            destination=stripe_account_id,
            metadata={
                'collaborationId': collaboration_id,
                'brandId': brand_id,
                'influencerId': influencer_id
            }
        )

        collab_ref.update({
            'payoutStatus': 'paid',
            'status': 'completed',
            'stripeTransferId': transfer.id,
            'influencerPayoutAmount': round(influencer_cents / 100, 2),
            'platformFeeAmount': round(platform_fee_cents / 100, 2),
            'paidOutAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        return _json_response({
            'success': True,
            'released': True,
            'influencerPayoutAmount': round(influencer_cents / 100, 2),
            'platformFeeAmount': round(platform_fee_cents / 100, 2)
        })
    except AuthorizationError as auth_err:
        return _json_response({'error': str(auth_err)}, status=auth_err.status)
    except Exception as exc:
        print(f'Erreur approve_collaboration_delivery_handler: {str(exc)}')
        return _json_response({'error': str(exc)}, status=500)


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
    
    from lib.token_store import get_user_tokens
    from lib.youtube import update_youtube_stats
    from lib.tiktok import update_tiktok_stats

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
        from lib.contact import send_contact_email

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
