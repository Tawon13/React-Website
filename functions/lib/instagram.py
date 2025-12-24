"""
Intégration Instagram pour Collabzz
Gestion de l'OAuth et récupération des statistiques
"""

import os
import requests
from firebase_admin import firestore
from datetime import datetime, timedelta
from lib.token_store import save_tokens

# Configuration Facebook/Instagram OAuth (via Facebook Graph API)
# Priorité : variables d'environnement > valeurs par défaut
INSTAGRAM_CLIENT_ID = os.getenv('INSTAGRAM_CLIENT_ID', '1408160357321015')
INSTAGRAM_CLIENT_SECRET = os.getenv('INSTAGRAM_CLIENT_SECRET', '1cdc4efb9689b99f80efcc047eba3b24')
INSTAGRAM_REDIRECT_URI = os.getenv('INSTAGRAM_REDIRECT_URI', 'https://instagram-callback-handler-iro675zeta-uc.a.run.app')

# URLs API Facebook Graph (pour accès Instagram)
FACEBOOK_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth'
FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token'
INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'


def connect_instagram(user_id: str, state_token: str) -> str:
    """
    Génère l'URL d'autorisation Facebook pour accéder à Instagram
    
    Args:
        user_id: ID de l'utilisateur Firebase
        state_token: Token de sécurité pour la validation
        
    Returns:
        URL d'autorisation OAuth Facebook
    """
    # Scopes de base qui ne nécessitent pas d'approbation Meta
    # pages_show_list : liste les Pages Facebook de l'utilisateur
    # L'accès Instagram Business se fait via le token de la Page
    scope = 'pages_show_list'
    
    # Log pour debug
    print(f"Instagram connect - Redirect URI: {INSTAGRAM_REDIRECT_URI}")
    
    # Construction de l'URL d'autorisation Facebook
    params = {
        'client_id': INSTAGRAM_CLIENT_ID,
        'redirect_uri': INSTAGRAM_REDIRECT_URI,
        'scope': scope,
        'response_type': 'code',
        'state': state_token
    }
    
    query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
    authorization_url = f'{FACEBOOK_AUTH_URL}?{query_string}'
    
    return authorization_url


def instagram_callback(code: str, user_id: str) -> dict:
    """
    Callback OAuth Facebook - Récupère le token et accède au compte Instagram Business
    
    Args:
        code: Code d'autorisation OAuth Facebook
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        Dictionnaire avec les données de l'utilisateur Instagram
    """
    # Log pour debug
    print(f"Instagram callback - Redirect URI: {INSTAGRAM_REDIRECT_URI}")
    
    # Échanger le code contre un access token Facebook
    token_url = f'https://graph.facebook.com/v21.0/oauth/access_token'
    token_params = {
        'client_id': INSTAGRAM_CLIENT_ID,
        'client_secret': INSTAGRAM_CLIENT_SECRET,
        'redirect_uri': INSTAGRAM_REDIRECT_URI,
        'code': code
    }
    
    token_response = requests.get(token_url, params=token_params)
    token_json = token_response.json()
    
    # Log pour debug
    print(f"Token response status: {token_response.status_code}")
    print(f"Token response: {token_json}")
    
    if 'error' in token_json:
        error_msg = token_json.get('error', {})
        if isinstance(error_msg, dict):
            error_detail = error_msg.get('message', 'Unknown error')
        else:
            error_detail = str(error_msg)
        raise Exception(f"Facebook OAuth error: {error_detail}")
    
    if token_response.status_code != 200:
        raise Exception(f"Facebook token exchange failed with status {token_response.status_code}: {token_json}")
    
    access_token = token_json['access_token']
    
    # Récupérer les Pages Facebook de l'utilisateur
    pages_url = 'https://graph.facebook.com/v21.0/me/accounts'
    pages_params = {
        'access_token': access_token,
        'fields': 'id,name,access_token'
    }
    
    pages_response = requests.get(pages_url, params=pages_params)
    pages_response.raise_for_status()
    pages_json = pages_response.json()
    
    if not pages_json.get('data'):
        raise Exception("Aucune Page Facebook trouvée. Vous devez avoir une Page Facebook liée à votre compte Instagram Business.")
    
    # Prendre la première page (ou demander à l'utilisateur de choisir)
    page = pages_json['data'][0]
    page_access_token = page['access_token']
    page_id = page['id']
    
    # Récupérer le compte Instagram Business lié à cette Page
    instagram_account_url = f'https://graph.facebook.com/v21.0/{page_id}'
    instagram_params = {
        'fields': 'instagram_business_account',
        'access_token': page_access_token
    }
    
    instagram_response = requests.get(instagram_account_url, params=instagram_params)
    instagram_response.raise_for_status()
    instagram_json = instagram_response.json()
    
    if 'instagram_business_account' not in instagram_json:
        raise Exception("Aucun compte Instagram Business trouvé lié à cette Page Facebook. Veuillez connecter un compte Instagram Business à votre Page.")
    
    instagram_account_id = instagram_json['instagram_business_account']['id']
    
    # Récupérer les détails du compte Instagram
    ig_profile_url = f'https://graph.facebook.com/v21.0/{instagram_account_id}'
    ig_params = {
        'fields': 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
        'access_token': page_access_token
    }
    
    ig_response = requests.get(ig_profile_url, params=ig_params)
    ig_response.raise_for_status()
    ig_profile = ig_response.json()
    
    username = ig_profile.get('username')
    followers = ig_profile.get('followers_count', 0)
    media_count = ig_profile.get('media_count', 0)
    profile_picture = ig_profile.get('profile_picture_url', '')
    
    # Échanger contre un long-lived token (60 jours)
    long_token_url = 'https://graph.facebook.com/v21.0/oauth/access_token'
    long_token_params = {
        'grant_type': 'fb_exchange_token',
        'client_id': INSTAGRAM_CLIENT_ID,
        'client_secret': INSTAGRAM_CLIENT_SECRET,
        'fb_exchange_token': page_access_token
    }
    
    long_token_response = requests.get(long_token_url, params=long_token_params)
    long_token_response.raise_for_status()
    long_token_json = long_token_response.json()
    
    long_lived_token = long_token_json.get('access_token', page_access_token)
    expires_in = long_token_json.get('expires_in', 5184000)  # 60 jours par défaut
    
    # Calculer l'expiration du token
    expires_at = datetime.now() + timedelta(seconds=expires_in)
    
    # Sauvegarder dans Firestore
    db = firestore.client()
    user_ref = db.collection('influencers').document(user_id)
    
    user_ref.update({
        'socialAccounts.instagram': {
            'connected': True,
            'instagramId': instagram_account_id,
            'username': username,
            'accountType': 'BUSINESS',
            'followers': followers,
            'mediaCount': media_count,
            'profilePicture': profile_picture,
            'pageId': page_id,
            'lastUpdated': firestore.SERVER_TIMESTAMP
        }
    })

    save_tokens(user_id, 'instagram', {
        'accessToken': long_lived_token,
        'instagramId': instagram_account_id,
        'pageId': page_id,
        'expiresAt': expires_at,
        'createdAt': firestore.SERVER_TIMESTAMP
    })
    
    return {
        'success': True,
        'username': username,
        'followers': followers,
        'mediaCount': media_count
    }


def update_instagram_stats(user_id: str, tokens: dict) -> dict:
    """
    Met à jour les statistiques Instagram Business (appelé quotidiennement)
    
    Args:
        user_id: ID de l'utilisateur Firebase
        tokens: Dictionnaire avec les tokens Instagram
        
    Returns:
        Résultat de la mise à jour
    """
    try:
        access_token = tokens.get('accessToken')
        expires_at = tokens.get('expiresAt')
        instagram_id = tokens.get('instagramId')
        
        # Vérifier si le token a expiré
        if expires_at and datetime.now() >= expires_at.replace(tzinfo=None):
            return {'success': False, 'error': 'Token expired'}
        
        # Récupérer les stats mises à jour depuis l'API Facebook Graph
        profile_url = f'https://graph.facebook.com/v21.0/{instagram_id}'
        profile_params = {
            'fields': 'username,followers_count,follows_count,media_count',
            'access_token': access_token
        }
        
        profile_response = requests.get(profile_url, params=profile_params)
        profile_response.raise_for_status()
        profile_json = profile_response.json()
        
        followers = profile_json.get('followers_count', 0)
        media_count = profile_json.get('media_count', 0)
        
        # Mettre à jour Firestore
        db = firestore.client()
        user_ref = db.collection('influencers').document(user_id)
        
        user_ref.update({
            'socialAccounts.instagram.followers': followers,
            'socialAccounts.instagram.mediaCount': media_count,
            'socialAccounts.instagram.lastUpdated': firestore.SERVER_TIMESTAMP
        })
        
        return {
            'success': True,
            'followers': followers,
            'mediaCount': media_count
        }
        
    except Exception as e:
        print(f"Erreur mise à jour Instagram pour {user_id}: {str(e)}")
        return {'success': False, 'error': str(e)}
