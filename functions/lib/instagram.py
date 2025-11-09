"""
Intégration Instagram pour Collabzz
Gestion de l'OAuth et récupération des statistiques
"""

import os
import requests
from firebase_admin import firestore
from datetime import datetime, timedelta

# Configuration Instagram OAuth
INSTAGRAM_CLIENT_ID = os.getenv('INSTAGRAM_CLIENT_ID')
INSTAGRAM_CLIENT_SECRET = os.getenv('INSTAGRAM_CLIENT_SECRET')
INSTAGRAM_REDIRECT_URI = os.getenv('INSTAGRAM_REDIRECT_URI') or 'https://us-central1-collabzzinflu.cloudfunctions.net/instagram_callback_handler'

# URLs API Instagram
INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize'
INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'


def connect_instagram(user_id: str) -> str:
    """
    Génère l'URL d'autorisation Instagram
    
    Args:
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        URL d'autorisation OAuth
    """
    # Scopes Instagram Basic Display
    scope = 'user_profile,user_media'
    
    # Construction de l'URL d'autorisation
    params = {
        'client_id': INSTAGRAM_CLIENT_ID,
        'redirect_uri': INSTAGRAM_REDIRECT_URI,
        'scope': scope,
        'response_type': 'code',
        'state': user_id
    }
    
    query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
    authorization_url = f'{INSTAGRAM_AUTH_URL}?{query_string}'
    
    return authorization_url


def instagram_callback(code: str, user_id: str) -> dict:
    """
    Callback OAuth Instagram - Récupère le token et les stats initiales
    
    Args:
        code: Code d'autorisation OAuth
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        Dictionnaire avec les données de l'utilisateur
    """
    # Échanger le code contre un access token (short-lived)
    token_data = {
        'client_id': INSTAGRAM_CLIENT_ID,
        'client_secret': INSTAGRAM_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'redirect_uri': INSTAGRAM_REDIRECT_URI,
        'code': code
    }
    
    token_response = requests.post(INSTAGRAM_TOKEN_URL, data=token_data)
    token_response.raise_for_status()
    token_json = token_response.json()
    
    if 'error' in token_json:
        raise Exception(f"Instagram OAuth error: {token_json.get('error_message')}")
    
    short_lived_token = token_json['access_token']
    user_instagram_id = token_json['user_id']
    
    # Échanger contre un long-lived token (60 jours)
    long_token_url = f'{INSTAGRAM_GRAPH_URL}/access_token'
    long_token_params = {
        'grant_type': 'ig_exchange_token',
        'client_secret': INSTAGRAM_CLIENT_SECRET,
        'access_token': short_lived_token
    }
    
    long_token_response = requests.get(long_token_url, params=long_token_params)
    long_token_response.raise_for_status()
    long_token_json = long_token_response.json()
    
    access_token = long_token_json['access_token']
    expires_in = long_token_json.get('expires_in', 5184000)  # 60 jours par défaut
    
    # Récupérer les infos du profil
    profile_url = f'{INSTAGRAM_GRAPH_URL}/{user_instagram_id}'
    profile_params = {
        'fields': 'id,username,account_type,media_count',
        'access_token': access_token
    }
    
    profile_response = requests.get(profile_url, params=profile_params)
    profile_response.raise_for_status()
    profile_json = profile_response.json()
    
    username = profile_json.get('username')
    media_count = profile_json.get('media_count', 0)
    account_type = profile_json.get('account_type', 'PERSONAL')
    
    # Note: L'API Basic Display ne donne pas accès au nombre de followers
    # Il faut l'API Instagram Graph (Business/Creator account) pour ça
    followers = 0
    
    # Calculer l'expiration du token
    expires_at = datetime.now() + timedelta(seconds=expires_in)
    
    # Sauvegarder dans Firestore
    db = firestore.client()
    user_ref = db.collection('influencers').document(user_id)
    
    user_ref.update({
        'socialAccounts.instagram': {
            'connected': True,
            'instagramId': user_instagram_id,
            'username': username,
            'accountType': account_type,
            'followers': followers,
            'mediaCount': media_count,
            'lastUpdated': firestore.SERVER_TIMESTAMP
        },
        'tokens.instagram': {
            'accessToken': access_token,
            'expiresAt': expires_at,
            'createdAt': firestore.SERVER_TIMESTAMP
        }
    })
    
    return {
        'success': True,
        'username': username,
        'followers': followers,
        'mediaCount': media_count
    }


def update_instagram_stats(user_id: str, tokens: dict) -> dict:
    """
    Met à jour les statistiques Instagram (appelé quotidiennement)
    
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
        
        # Récupérer les stats mises à jour
        profile_url = f'{INSTAGRAM_GRAPH_URL}/{instagram_id}'
        profile_params = {
            'fields': 'username,media_count',
            'access_token': access_token
        }
        
        profile_response = requests.get(profile_url, params=profile_params)
        profile_response.raise_for_status()
        profile_json = profile_response.json()
        
        media_count = profile_json.get('media_count', 0)
        
        # Mettre à jour Firestore
        db = firestore.client()
        user_ref = db.collection('influencers').document(user_id)
        
        user_ref.update({
            'socialAccounts.instagram.mediaCount': media_count,
            'socialAccounts.instagram.lastUpdated': firestore.SERVER_TIMESTAMP
        })
        
        return {
            'success': True,
            'mediaCount': media_count
        }
        
    except Exception as e:
        print(f"Erreur mise à jour Instagram pour {user_id}: {str(e)}")
        return {'success': False, 'error': str(e)}
